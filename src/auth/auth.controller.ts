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
import type { CookieOptions } from 'express';


const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 1000,
};

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

    res.cookie('jwt', tokenData.access_token, cookieOptions);

    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    return {
      authenticated: true,
      admin: {
        id: req.user.id,
        email: req.user.email,
      },
    };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) res: Response) {
    const { maxAge, ...clearOptions } = cookieOptions;
  res.clearCookie('jwt', clearOptions);

    return { success: true };
  }
}