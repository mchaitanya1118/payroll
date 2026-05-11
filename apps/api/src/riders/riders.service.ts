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
        status: data.status || "ACTIVE",
        zone: data.zone || null,
        nationality: data.nationality || null,
        vehicleOwnership: data.vehicleOwnership || data.vehicle_ownership || null,
        vehicleNumber: data.vehicleNumber || data.vehicle_number || null,
        vehicleModel: data.vehicleModel || data.vehicle_model || null,
        groupId: data.groupId || null,
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
        status: data.status !== undefined ? data.status : undefined,
        zone: data.zone !== undefined ? data.zone : undefined,
        nationality: data.nationality !== undefined ? data.nationality : undefined,
        vehicleOwnership:
          (data.vehicleOwnership || data.vehicle_ownership) !== undefined
            ? data.vehicleOwnership || data.vehicle_ownership
            : undefined,
        vehicleNumber:
          (data.vehicleNumber || data.vehicle_number) !== undefined
            ? data.vehicleNumber || data.vehicle_number
            : undefined,
        vehicleModel:
          (data.vehicleModel || data.vehicle_model) !== undefined
            ? data.vehicleModel || data.vehicle_model
            : undefined,
        groupId: data.groupId !== undefined ? data.groupId : undefined,
      },
    });
  }

  async getCompanies(tenantId: string) {
    try {
      const riders = await this.prisma.rider.findMany({
        where: { 
          tenantId, 
          companyCode: { not: null } 
        },
        select: { companyCode: true },
        distinct: ['companyCode'],
      });
      return riders.map((r) => r.companyCode).filter(Boolean);
    } catch (error) {
      console.error('[RidersService] getCompanies failure:', error);
      return [];
    }
  }

  // GPS Tracking Methods
  async updateLocation(riderId: string, lat: number, lng: number) {
    const timestamp = new Date();
    await this.prisma.rider.update({
      where: { id: riderId },
      data: {
        lastLat: lat,
        lastLng: lng,
        lastLocationUpdate: timestamp,
      }
    });

    return this.prisma.riderLocation.create({
      data: {
        riderId,
        lat,
        lng,
        timestamp,
      }
    });
  }

  async getActiveLocations(tenantId: string) {
    try {
      console.log(`[RidersService] Fetching active locations for tenant: ${tenantId}`);
      const riders = await this.prisma.rider.findMany({
        where: {
          tenantId,
          lastLat: { not: null },
          lastLng: { not: null },
        },
        select: {
          id: true,
          riderId: true,
          riderName: true,
          lastLat: true,
          lastLng: true,
          lastLocationUpdate: true,
          status: true,
          vehicleType: true,
        },
        orderBy: { lastLocationUpdate: 'desc' }
      });
      console.log(`[RidersService] Found ${riders.length} riders with locations`);
      return riders;
    } catch (error) {
      console.error('[RidersService] getActiveLocations failure:', error);
      throw error;
    }
  }
}
