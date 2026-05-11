import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RiderGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.riderGroup.findMany({
      where: { tenantId },
      include: {
        rates: true,
        _count: {
          select: { riders: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findOne(id: string, tenantId: string) {
    const group = await this.prisma.riderGroup.findUnique({
      where: { id },
      include: {
        rates: true,
        riders: true
      }
    });

    if (!group || group.tenantId !== tenantId) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  async create(tenantId: string, name: string) {
    return this.prisma.riderGroup.create({
      data: {
        name,
        tenantId
      }
    });
  }

  async update(id: string, tenantId: string, name: string) {
    await this.findOne(id, tenantId);
    return this.prisma.riderGroup.update({
      where: { id },
      data: { name }
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.riderGroup.delete({
      where: { id }
    });
  }

  async upsertRate(groupId: string, tenantId: string, rateData: any) {
    await this.findOne(groupId, tenantId);
    const { vehicleType, rateType, targetCount, riderRateSingle, riderRateDouble, companyRateSingle, companyRateDouble } = rateData;

    return this.prisma.groupRate.upsert({
      where: {
        groupId_vehicleType_rateType: {
          groupId,
          vehicleType,
          rateType
        }
      },
      update: {
        targetCount,
        riderRateSingle,
        riderRateDouble,
        companyRateSingle,
        companyRateDouble
      },
      create: {
        groupId,
        vehicleType,
        rateType,
        targetCount,
        riderRateSingle,
        riderRateDouble,
        companyRateSingle,
        companyRateDouble
      }
    });
  }

  async deleteRate(rateId: string, tenantId: string) {
    const rate = await this.prisma.groupRate.findUnique({
      where: { id: rateId },
      include: { group: true }
    });

    if (!rate || rate.group.tenantId !== tenantId) {
      throw new NotFoundException('Rate not found');
    }

    return this.prisma.groupRate.delete({
      where: { id: rateId }
    });
  }

  async addRiders(groupId: string, tenantId: string, riderIds: string[]) {
    await this.findOne(groupId, tenantId);
    return this.prisma.rider.updateMany({
      where: {
        id: { in: riderIds },
        tenantId
      },
      data: { groupId }
    });
  }

  async removeRider(groupId: string, tenantId: string, riderId: string) {
    await this.findOne(groupId, tenantId);
    return this.prisma.rider.update({
      where: { id: riderId, tenantId },
      data: { groupId: null }
    });
  }
}
