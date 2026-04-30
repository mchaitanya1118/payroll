import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: any) {
    const { email, password, name, tenantName } = data;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: tenantName },
      });

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "ADMIN",
          tenantId: tenant.id,
        },
      });

      const { password: _, ...result } = user;
      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      });

      return { user: result, token };
    });
  }

  async login(data: any) {
    const { email, password } = data;
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const { password: _, ...result } = user;
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    return { user: result, token };
  }
}
