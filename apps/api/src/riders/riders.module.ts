import { Module } from "@nestjs/common";
import { RidersController } from "./riders.controller";
import { RidersService } from "./riders.service";
import { RiderPortalController } from "./rider-portal.controller";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "secret",
      signOptions: { expiresIn: "30d" },
    }),
  ],
  controllers: [RidersController, RiderPortalController],
  providers: [RidersService],
})
export class RidersModule {}
