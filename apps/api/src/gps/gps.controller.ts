import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { GpsService } from './gps.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('gps')
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Post('update')
  async update(@Body() body: { riderId: string; lat: number; lng: number }) {
    // In a production app, this would be authenticated via a Rider token.
    // For this simulation/admin context, we'll allow updates via rider database ID.
    return this.gpsService.updateLocation(body.riderId, body.lat, body.lng);
  }

  @UseGuards(JwtAuthGuard)
  @Get('active')
  async getActive(@Request() req: any) {
    return this.gpsService.getActiveLocations(req.user.tenantId);
  }

  @Get('ping')
  async ping() {
    return { status: 'gps-alive' };
  }
}
