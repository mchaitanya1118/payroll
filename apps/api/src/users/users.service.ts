import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(tenantId: string, data: any) {
    const { email, password, name, role } = data;

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || UserRole.ACCOUNTANT,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    const { email, name, role, password } = data;

    // Check if user belongs to tenant
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });
    if (!user) {
      throw new ConflictException("User not found");
    }

    const updateData: any = { email, name, role };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    // Prevent self-deletion if needed, but let's just check tenant ownership
    return this.prisma.user.deleteMany({
      where: { id, tenantId },
    });
  }
}
