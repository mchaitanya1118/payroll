import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async createBatch(tenantId: string, data: any) {
    return this.prisma.batch.create({
      data: {
        tenantId,
        batchNumber: parseInt(data.batch_number),
        rateSingleOrder: parseFloat(data.rate_single_order),
        rateDoubleOrder: parseFloat(data.rate_double_order),
      },
    });
  }

  async getBatches(tenantId: string) {
    return this.prisma.batch.findMany({
      where: { tenantId },
    });
  }
}
