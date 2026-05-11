import { Module } from '@nestjs/common';
import { RiderGroupsService } from './rider-groups.service';
import { RiderGroupsController } from './rider-groups.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RiderGroupsService],
  controllers: [RiderGroupsController],
  exports: [RiderGroupsService]
})
export class RiderGroupsModule {}
