import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RiderGroupsService } from './rider-groups.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rider-groups')
export class RiderGroupsController {
  constructor(private readonly riderGroupsService: RiderGroupsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.riderGroupsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.riderGroupsService.findOne(id, req.user.tenantId);
  }

  @Post()
  create(@Body('name') name: string, @Request() req: any) {
    return this.riderGroupsService.create(req.user.tenantId, name);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body('name') name: string, @Request() req: any) {
    return this.riderGroupsService.update(id, req.user.tenantId, name);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.riderGroupsService.delete(id, req.user.tenantId);
  }

  @Post(':id/rates')
  upsertRate(@Param('id') groupId: string, @Body() rateData: any, @Request() req: any) {
    return this.riderGroupsService.upsertRate(groupId, req.user.tenantId, rateData);
  }

  @Delete('rates/:rateId')
  deleteRate(@Param('rateId') rateId: string, @Request() req: any) {
    return this.riderGroupsService.deleteRate(rateId, req.user.tenantId);
  }

  @Post(':id/riders')
  addRiders(@Param('id') groupId: string, @Body('riderIds') riderIds: string[], @Request() req: any) {
    return this.riderGroupsService.addRiders(groupId, req.user.tenantId, riderIds);
  }

  @Delete(':id/riders/:riderId')
  removeRider(@Param('id') groupId: string, @Param('riderId') riderId: string, @Request() req: any) {
    return this.riderGroupsService.removeRider(groupId, req.user.tenantId, riderId);
  }
}
