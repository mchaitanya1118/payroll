import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdvancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.advance.create({
      data: {
        ...data,
        tenantId,
        balance: data.amount, // Initial balance is the full amount
      },
    });
  }

  async findAll(tenantId: string, search?: string, companyCode?: string) {
    const where: any = { tenantId };

    if (companyCode) {
      where.rider = { companyCode };
    }

    if (search) {
      const searchFilter = {
        OR: [
          { riderId: { contains: search, mode: 'insensitive' } },
          { riderName: { contains: search, mode: 'insensitive' } },
        ]
      };
      
      if (where.rider) {
        where.AND = [
          { rider: where.rider },
          { rider: searchFilter }
        ];
        delete where.rider;
      } else {
        where.rider = searchFilter;
      }
    }

    return this.prisma.advance.findMany({
      where,
      include: {
        rider: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByRider(tenantId: string, riderId: string) {
    return this.prisma.advance.findMany({
      where: {
        tenantId,
        riderId,
        balance: { gt: 0 },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const advance = await this.prisma.advance.findFirst({
      where: { id, tenantId },
    });

    if (!advance) throw new NotFoundException("Advance not found");

    return this.prisma.advance.delete({
      where: { id },
    });
  }
}
