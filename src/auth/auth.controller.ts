import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUPDto } from './dtos/signup.dto';
import { LogInDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { takeWhile } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  Signup(@Body() signupdata: SignUPDto) {
    return this.authService.Signup(signupdata);
  }

  @Post('login')
  Login(@Body() logindata: LogInDto) {
    return this.authService.Login(logindata);
  }

  @Post('refresh')
  refreshToken(@Body() refreshtokendata: RefreshTokenDto) {
    return this.authService.refreshToken(refreshtokendata);
  }
}
