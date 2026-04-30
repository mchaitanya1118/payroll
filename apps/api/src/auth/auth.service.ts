import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: any) {
    const { email, password, name, tenantName } = data;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: tenantName },
      });

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "ADMIN",
          tenantId: tenant.id,
        },
      });

      const { password: _, ...result } = user;
      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      });

      return { user: result, token };
    });
  }

  async login(data: any) {
    console.log("[AuthService] Login attempt for:", data.email);
    try {
      const { email, password } = data;
      
      console.log("[AuthService] Fetching user from DB...");
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { tenant: true },
      });

      if (!user) {
        console.log("[AuthService] User not found");
        throw new UnauthorizedException("Invalid credentials");
      }
      
      console.log("[AuthService] Comparing passwords...");
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("[AuthService] Password mismatch");
        throw new UnauthorizedException("Invalid credentials");
      }

      console.log("[AuthService] Signing JWT token...");
      const { password: _, ...result } = user;
      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      });

      console.log("[AuthService] Login successful");
      return { user: result, token };
    } catch (error) {
      console.error("[AuthService] FATAL Login Error:", {
        message: error.message,
        stack: error.stack,
        email: data.email
      });
      throw error;
    }
  }
}
