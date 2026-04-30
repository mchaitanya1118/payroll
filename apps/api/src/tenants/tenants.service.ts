import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async getTenantSettings(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        currency: true,
        currencySymbol: true,
      },
    });
  }

  async updateTenantSettings(tenantId: string, data: any) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.name,
        currency: data.currency,
        currencySymbol: data.currencySymbol,
      },
    });
  }
}
