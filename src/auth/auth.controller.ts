import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  UnauthorizedException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password } = body;
    const admin = await this.authService.validateAdmin(email, password);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokenData = await this.authService.login(admin);
    // set httpOnly cookie; allow cross-site XHR from frontend
    res.cookie('jwt', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: 'localhost',
      path: '/',
      sameSite: 'none',
      maxAge: 60 * 60 * 24 * 1000, // 1 day
    });
    // also return the token so the frontend can use Authorization header if needed
    return { success: true, access_token: tokenData.access_token };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    // JwtAuthGuard attaches user to request
    return { authenticated: true, admin: req.user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt', { path: '/', domain: 'localhost', sameSite: 'none' });
    return { success: true };
  }
}
