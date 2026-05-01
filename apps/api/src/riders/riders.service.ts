import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RidersService {
  constructor(private readonly prisma: PrismaService) {}

  async createRider(tenantId: string, data: any) {
    return this.prisma.rider.create({
      data: {
        tenantId,
        riderId: data.riderId || data.rider_id,
        riderName: data.riderName || data.rider_name,
        vehicleType:
          (data.vehicleType || data.vehicle_type) === "CAR" ? "CAR" : "BIKE",
        rateType: data.rateType || data.rate_type || "TARGET",
        companyCode: data.companyCode || data.company_code || null,
        email: data.email || null,
        phoneNumber: data.phoneNumber || data.phone_number || null,
      },
    });
  }

  async getRiders(
    tenantId: string,
    filters: {
      search?: string;
      vehicleType?: string;
      companyCode?: string;
    } = {},
  ) {
    const where: any = { tenantId };

    if (filters.search) {
      where.OR = [
        { riderId: { contains: filters.search, mode: "insensitive" } },
        { riderName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.vehicleType && filters.vehicleType !== "ALL") {
      where.vehicleType = filters.vehicleType;
    }

    if (filters.companyCode && filters.companyCode !== "ALL") {
      where.companyCode = {
        contains: filters.companyCode,
        mode: "insensitive",
      };
    }

    return this.prisma.rider.findMany({ where });
  }

  async getRidersCount(tenantId: string) {
    return this.prisma.rider.count({
      where: { tenantId },
    });
  }

  async deleteRider(tenantId: string, id: string) {
    // Manually delete foreign key relations first, ensuring they belong to this tenant
    await this.prisma.dailyEntry.deleteMany({
      where: { 
        riderId: id,
        rider: { tenantId } 
      } 
    });
    await this.prisma.payslip.deleteMany({ 
      where: { 
        riderId: id,
        tenantId 
      } 
    });

    return this.prisma.rider.delete({
      where: { id, tenantId },
    });
  }

  async updateRider(tenantId: string, id: string, data: any) {
    return this.prisma.rider.update({
      where: { id, tenantId },
      data: {
        riderName: data.riderName || data.rider_name,
        vehicleType:
          (data.vehicleType || data.vehicle_type) === "CAR" ? "CAR" : "BIKE",
        rateType: data.rateType || data.rate_type,
        companyCode: data.companyCode || data.company_code || null,
        email: data.email !== undefined ? data.email : undefined,
        phoneNumber:
          (data.phoneNumber || data.phone_number) !== undefined
            ? data.phoneNumber || data.phone_number
            : undefined,
      },
    });
  }
}
