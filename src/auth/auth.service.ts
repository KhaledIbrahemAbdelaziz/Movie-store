import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { SignUPDto } from './dtos/signup.dto';
import * as bcrypt from 'bcrypt';
import { UserDto } from 'src/users/dtos/user.dto';
import { User } from 'src/users/Schemas/user.schema';
import { LogInDto } from './dtos/login.dto';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { ForgotPasswordDto } from 'src/users/dtos/forgot-password.dto';
import { ResetPasswordDto } from 'src/users/dtos/reset-password.dto';
import { VerifyOtpDto } from 'src/users/dtos/verify-otp.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async Signup(signupData: SignUPDto) {
    const existing = await this.userService.findUserbyemail(signupData.email);
    if (existing) {
      throw new BadRequestException('Unable to create email.');
    }
    const hashpassword = await bcrypt.hash(signupData.password, 10);
    const create: UserDto = {
      username: signupData.username,
      email: signupData.email,
      password: hashpassword,
      role: signupData.role,
    };
    const user = await this.userService.createUsers(create);
    const tokens = await this.generateTokens(user);
    //await this.saveRefreshToken(user, tokens.refreshtoken);
    return {
      success: true,
      message: 'User Created Successfully',
      data: {
        user: {
          id: user['_id'],
          username: user.username,
          email: user.email,
          role: user.role,
        },
        ...tokens,
      },
    };
  }

  async Login(loginData: LogInDto) {
    const user = await this.userService.findUserbyemail(loginData.email);
    if (!user) {
      await bcrypt.compare(loginData.password, this.dummyhash());
      throw new UnauthorizedException('Wrong Credentials.');
    }
    const matchpass = await bcrypt.compare(loginData.password, user.password);
    if (!matchpass) {
      throw new UnauthorizedException('Wrong Credentials.');
    }
    const tokens = await this.generateTokens(user);
    //await this.saveRefreshToken(user, tokens.refreshtoken);
    return {
      success: true,
      message: 'User Logged in Successfully',
      data: {
        user: {
          id: user['_id'],
          username: user.username,
          email: user.email,
          role: user.role,
        },
        ...tokens,
      },
    };
  }

  async logout(userid: string) {
    const user = await this.userService.findById(userid);
    if (!user) throw new UnauthorizedException('User not found');
    user.hashedRefreshToken = '';
    user.tokenVersion += 1;
    await user.save();
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  private async generateTokens(user: User) {
    const accesstoken = await this.generateAccessToken(user);
    const refreshtoken = await this.generateRefreshToken(user);
    await this.saveRefreshToken(user, refreshtoken);
    return {
      accesstoken,
      refreshtoken,
    };
  }

  private async generateAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_EXPIRES',
      ) as StringValue,
    });
  }

  private async generateRefreshToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_REFRESH_EXPIRES',
      ) as StringValue,
    });
  }

  private async saveRefreshToken(user: User, refresh: string) {
    user.hashedRefreshToken = await bcrypt.hash(refresh, 10);
    await user.save();
  }

  async refreshToken(refreshtoken: string) {
    if (!refreshtoken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(
        refreshtoken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('The user is not found');
      }
      if (!user.hashedRefreshToken) {
        throw new UnauthorizedException('Refresh token is missing');
      }
      const isvalidrefreshtoken = await bcrypt.compare(
        refreshtoken,
        user.hashedRefreshToken ?? '',
      );
      if (!isvalidrefreshtoken) {
        throw new UnauthorizedException('Invalid Refresh Token');
      }
      const tokens = await this.generateTokens(user);

      return {
        success: true,
        message: 'Token refreshed Successfully',
        data: tokens,
      };
    } catch {
      throw new UnauthorizedException('Invalid Refresh Token');
      /*console.log(error);
      throw error;*/
    }
  }

  async forgotPassword(ForgotPassworddata: ForgotPasswordDto) {
    const user = await this.userService.findUserbyemail(
      ForgotPassworddata.email,
    );

    if (!user) {
      return {
        sucess: true,
        message: 'OTP has been sent',
        data: null,
      };
    }

    const otp = this.generateOtp();
    const hashedotp = await bcrypt.hash(otp, 10);
    user.passwordResetOTP = hashedotp;
    user.passwordResetOTPExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await this.mailService.sendOTPEmail(user.email, otp);

    return {
      success: true,
      message: 'OTP sent successfully',
      data: null,
    };
  }

  async verifyOtp(verifyOtpdata: VerifyOtpDto) {
    const user = await this.userService.findUserbyemail(verifyOtpdata.email);

    if (!user) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.passwordResetOTP || !user.passwordResetOTPExpires) {
      throw new BadRequestException('OTP is missing');
    }

    if (user.passwordResetOTPExpires < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    const isValid = await bcrypt.compare(
      verifyOtpdata.otp,
      user.passwordResetOTP,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    return {
      success: true,
      message: 'OTP Verified Successfully',
      data: null,
    };
  }

  async Resetpassword(Resetpassworddata: ResetPasswordDto) {
    const user = await this.userService.findUserbyemail(
      Resetpassworddata.email,
    );

    if (!user) {
      throw new BadRequestException('Invalid Request');
    }

    /*if (!user.passwordResetOTP || !user.passwordResetOTPExpires) {
      throw new BadRequestException('OTP is missing');
    }

    if (user.passwordResetOTPExpires < new Date()) {
      throw new BadRequestException('OTP has been expired');
    }*/

    const valid = await bcrypt.compare(
      Resetpassworddata.otp,
      user.passwordResetOTP!,
    );

    if (!valid) {
      throw new BadRequestException('Invalid OTP');
    }

    user.password = await bcrypt.hash(Resetpassworddata.newPassword, 10);
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    user.hashedRefreshToken = undefined;

    await user.save();

    return {
      success: true,
      message: 'Password reset successfully',
      data: null,
    };
  }

  private dummyhash(): string {
    return this.configService.getOrThrow<string>('DUMMY_HASH');
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
