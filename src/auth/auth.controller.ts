import { Body, Controller, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUPDto } from './dtos/signup.dto';
import { LogInDto } from './dtos/login.dto';
import * as express from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ForgotPasswordDto } from 'src/users/dtos/forgot-password.dto';
import { VerifyOtpDto } from 'src/users/dtos/verify-otp.dto';
import { ResetPasswordDto } from 'src/users/dtos/reset-password.dto';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { IdempotencyInterceptor } from 'src/common/Interceptors/idempotency.interceptor';
import { Throttle } from '@nestjs/throttler';
import { verify } from 'crypto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UseInterceptors(IdempotencyInterceptor)
  @Throttle({ signup: { ttl: 60000, limit: 3 } })
  async Signup(
    @Body() signupdata: SignUPDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.Signup(signupdata);
    res.cookie('accessToken', result.data.accesstoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', result.data.refreshtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      message: result.message,
      accesstoken: result.data.accesstoken,
      user: result.data.user,
    };
  }

  @Post('login')
  @Throttle({ login: { ttl: 60000, limit: 5 } })
  async Login(
    @Body() logindata: LogInDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.Login(logindata);
    res.cookie('accessToken', result.data.accesstoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', result.data.refreshtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      message: result.message,
      accesstoken: result.data.accesstoken,
      user: result.data.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async Logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const user = req.user as JwtPayload;
    await this.authService.logout(user.sub);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return {
      message: 'The user logged out successfully',
    };
  }

  @Post('refresh')
  @Throttle({ refresh: { ttl: 60000, limit: 10 } })
  async refreshToken(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies.refreshToken;
    const result = await this.authService.refreshToken(refreshToken);
    res.cookie('accessToken', result.data.accesstoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', result.data.refreshtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      success: true,
      message: 'Token refreshed Successfully',
      data: {
        accesstoken: result.data.accesstoken,
      },
    };
  }

  @Post('forgot-password')
  @UseInterceptors(IdempotencyInterceptor)
  @Throttle({ otp: { ttl: 1000000, limit: 3 } })
  forgotpassword(@Body() forgotpassworddata: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotpassworddata);
  }

  @Post('verify-otp')
  @Throttle({ verify: { ttl: 100000, limit: 5 } })
  verifyOtp(@Body() verifyOtpdata: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpdata);
  }

  @Post('reset-password')
  @UseInterceptors(IdempotencyInterceptor)
  resetPassword(@Body() resetpassworddata: ResetPasswordDto) {
    return this.authService.Resetpassword(resetpassworddata);
  }
}
