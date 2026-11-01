import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
constructor(private prisma: PrismaService) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  super({
    jwtFromRequest: ExtractJwt.fromExtractors([
      (req) => req?.cookies?.jwt ?? null,
      ExtractJwt.fromAuthHeaderAsBearerToken(),
    ]),
    ignoreExpiration: false,
    secretOrKey: jwtSecret,
  });
}
  async validate(payload: any) {
    // you can attach more user info here if needed
    const admin = await this.prisma.admin.findUnique({ where: { id: payload.sub } });
    return admin;
  }
}
