import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentAuthService {
  private readonly clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(private readonly prisma: PrismaService) {}

  async verifyStudentToken(token: string) {
    let clerkId: string;

    try {
      const payload = await verifyToken(token, {
        jwtKey: process.env.CLERK_JWT_KEY?.replace(/\\n/g, '\n'),
        authorizedParties: [process.env.FRONTEND_URL as string],
      });

      clerkId = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired Clerk token');
    }

    try {
      const clerkUser = await this.clerkClient.users.getUser(clerkId);
      const email = clerkUser.emailAddresses.find(
        (item) => item.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress;

      if (!email) {
        throw new UnauthorizedException('Clerk account has no primary email');
      }

      const user = await this.prisma.user.upsert({
        where: { clerkId },
        update: { email },
        create: {
          clerkId,
          email,
          role: 'STUDENT',
        },
        select: {
          id: true,
          clerkId: true,
          email: true,
          role: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;

      throw new InternalServerErrorException(
        'Unable to sync student account',
      );
    }
  }
}