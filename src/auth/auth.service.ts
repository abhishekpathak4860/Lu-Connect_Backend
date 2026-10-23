import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return null;
    }
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return null;
    }
    return admin;
  }

  async login(admin: any) {
    const payload = { sub: admin.id, email: admin.email }; // you can add role
    return {
      access_token: this.jwtService.sign(payload),// jwt getting created
    };
  }
}
  