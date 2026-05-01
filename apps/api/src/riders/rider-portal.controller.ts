import {
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
  UseGuards,
  Request,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("rider-portal")
export class RiderPortalController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  @Post("login")
  async login(@Body() body: { riderId: string; phoneNumber: string }) {
    const rider = await this.prisma.rider.findFirst({
      where: {
        riderId: body.riderId,
        phoneNumber: body.phoneNumber,
      },
    });

    if (!rider) {
      throw new UnauthorizedException("Invalid Rider ID or Phone Number");
    }

    const payload = {
      sub: rider.id,
      riderId: rider.riderId,
      name: rider.riderName,
      role: "RIDER",
      tenantId: rider.tenantId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      rider: {
        id: rider.id,
        name: rider.riderName,
        riderId: rider.riderId,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("summary")
  async getSummary(@Request() req: any) {
    const riderId = req.user.sub;
    const tenantId = req.user.tenantId;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [payslip, advances, dailyEntries] = await Promise.all([
      this.prisma.payslip.findUnique({
        where: {
          tenantId_riderId_month_year: {
            tenantId,
            riderId,
            month,
            year,
          },
        },
      }),
      this.prisma.advance.findMany({
        where: { riderId, tenantId, balance: { gt: 0 } },
      }),
      this.prisma.dailyEntry.findMany({
        where: { riderId, payrollMonth: month, payrollYear: year },
        orderBy: { date: 'desc' },
        take: 7
      })
    ]);

    const totalAdvanceBalance = advances.reduce((sum, a) => sum + a.balance, 0);

    return {
      payslip,
      totalAdvanceBalance,
      recentEntries: dailyEntries,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("history")
  async getHistory(@Request() req: any) {
    const riderId = req.user.sub;
    const tenantId = req.user.tenantId;

    return this.prisma.payslip.findMany({
      where: { riderId, tenantId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 12
    });
  }
}
