import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import * as qrcode from "qrcode-terminal";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class WhatsappService implements OnModuleInit {
  private client: Client;
  private readonly logger = new Logger(WhatsappService.name);
  private qrCode: string | null = null;
  private isReady = false;
  private initializationStage: 'OFFLINE' | 'STARTING' | 'BROWSER_READY' | 'FETCHING_SESSION' | 'READY' = 'OFFLINE';

  constructor() {
    this.createClient();
  }

  private createClient() {
    this.initializationStage = 'STARTING';
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: "./.wwebjs_auth",
      }),
      webVersionCache: {
        type: "remote",
        remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1018250269-alpha.html",
      },
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--hide-scrollbars",
          "--mute-audio",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-breakpad",
          "--disable-component-extensions-with-background-pages",
          "--disable-extensions",
          "--disable-features=TranslateUI,BlinkGenPropertyTrees",
          "--disable-ipc-flooding-protection",
          "--disable-renderer-backgrounding",
          "--enable-features=NetworkService,NetworkServiceInProcess"
        ],
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });

    this.client.on("qr", (qr) => {
      this.qrCode = qr;
      this.initializationStage = 'BROWSER_READY';
      this.logger.log("WhatsApp QR Code received. Scan it to authenticate.");
      qrcode.generate(qr, { small: true });
    });

    this.client.on("ready", () => {
      this.isReady = true;
      this.qrCode = null;
      this.initializationStage = 'READY';
      this.logger.log("WhatsApp Client is READY");
    });

    this.client.on("loading_screen", (percent, message) => {
       this.initializationStage = 'FETCHING_SESSION';
       this.logger.log(`WhatsApp Loading: ${percent}% - ${message}`);
    });

    this.client.on("authenticated", () => {
      this.logger.log("WhatsApp Client AUTHENTICATED");
    });

    this.client.on("auth_failure", (msg) => {
      this.initializationStage = 'OFFLINE';
      this.logger.error(`WhatsApp AUTHENTICATION FAILURE: ${msg}`);
    });

    this.client.on("disconnected", (reason) => {
      this.isReady = false;
      this.initializationStage = 'OFFLINE';
      this.logger.warn(`WhatsApp Client DISCONNECTED: ${reason}`);
      this.client.initialize().catch(e => this.logger.error("Re-init failed", e));
    });
  }

  private cleanLockFiles() {
    const lockPath = path.join(process.cwd(), ".wwebjs_auth/session/SingletonLock");
    try {
      if (fs.existsSync(lockPath)) {
        this.logger.log("Removing WhatsApp session lock file...");
        fs.unlinkSync(lockPath);
      }
    } catch (err) {
      this.logger.warn("Could not remove WhatsApp lock file, it might be in use or already gone.");
    }
  }

  onModuleInit() {
    this.cleanLockFiles();
    this.client.initialize().catch((err) => {
      this.logger.error("Failed to initialize WhatsApp Client", err);
    });
  }

  getStatus() {
    return {
      ready: this.isReady,
      needsAuth: !!this.qrCode,
      qr: this.qrCode,
      stage: this.initializationStage,
    };
  }

  async sendPdf(
    phoneNumber: string,
    pdfBuffer: Buffer,
    fileName: string,
    caption?: string,
  ) {
    if (!this.isReady) {
      throw new Error("WhatsApp Client is not ready");
    }

    // Clean number: remove all non-digits
    let cleanNumber = phoneNumber.replace(/\D/g, "");
    
    // Saudi Arabia (SAR) Logic: 
    // Standard format is 9665XXXXXXXX
    // If user enters 05XXXXXXXX (10 digits), convert to 9665XXXXXXXX
    // If user enters 5XXXXXXXX (9 digits), convert to 9665XXXXXXXX
    if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      cleanNumber = '966' + cleanNumber.substring(1);
    } else if (cleanNumber.length === 9 && cleanNumber.startsWith('5')) {
      cleanNumber = '966' + cleanNumber;
    }

    const contactId = cleanNumber.includes("@") ? cleanNumber : `${cleanNumber}@c.us`;

    this.logger.log(`Resolving WhatsApp ID for ${contactId}...`);

    try {
      // getNumberId is the most reliable way to get the correct internal ID
      // and ensure the contact exists before sending
      const info = await this.client.getNumberId(cleanNumber);
      const targetId = info ? info._serialized : contactId;

      if (!info) {
        this.logger.warn(`Could not resolve official ID for ${cleanNumber}, trying direct send to ${contactId}`);
      }

      const media = new MessageMedia(
        "application/pdf",
        pdfBuffer.toString("base64"),
        fileName,
      );

      this.logger.log(`Sending PDF to ${targetId}...`);
      const response = await this.client.sendMessage(targetId, media, { caption });
      
      if (!response) {
         throw new Error("No response from WhatsApp engine.");
      }

      this.logger.log(`Message sent successfully to ${targetId}. ID: ${response.id.id}`);
      return response;
    } catch (e) {
      this.logger.error(`Delivery failed for ${cleanNumber}: ${e.message}`);
      throw new Error(`WhatsApp delivery failed: ${e.message}. Tip: Check if the number has a WhatsApp account.`);
    }
  }

  async logout() {
    try {
      this.logger.log("Logging out of WhatsApp...");
      this.initializationStage = 'OFFLINE';
      if (this.client) {
        try {
            await this.client.logout();
        } catch (e) {
            this.logger.warn("Native logout failed (might be expected): " + e.message);
        }
        await this.client.destroy();
      }
    } catch (err) {
      this.logger.warn("Logout error: " + err.message);
    } finally {
      this.isReady = false;
      this.qrCode = null;
      
      // Give it a moment to release file handles
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Force clean directories
      const authPath = path.join(process.cwd(), ".wwebjs_auth");
      if (fs.existsSync(authPath)) {
        try {
            const { execSync } = require('child_process');
            execSync(`rm -rf "${authPath}"`);
        } catch (err) {
            this.logger.error("Shell cleanup failed: " + err.message);
            // Fallback to sync
            try { fs.rmSync(authPath, { recursive: true, force: true }); } catch (e) {}
        }
      }
      
      this.logger.log("WhatsApp session cleared. Re-spawning client...");
      this.createClient();
      this.client.initialize().catch(e => this.logger.error("Post-logout re-init failed", e));
    }
  }
}
