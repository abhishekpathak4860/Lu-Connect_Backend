
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { StudentAuthService } from '../student-auth.service';


@Injectable()
export class StudentAuthGuard implements CanActivate {
  constructor(
    private readonly studentAuthService: StudentAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Bearer token is required');
    }

    try {
      const payload = await verifyToken(token, {
        jwtKey: process.env.CLERK_JWT_KEY?.replace(/\\n/g, '\n'),
        authorizedParties: [process.env.FRONTEND_URL as string],
      });

      const student = await this.studentAuthService.findStudentByClerkId(
        payload.sub,
      );

      request.student = student;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;

      throw new UnauthorizedException('Invalid or expired Clerk token');
    }
  }
}
