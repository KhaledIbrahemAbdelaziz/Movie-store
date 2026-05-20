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
import { Role } from 'src/common/enums/role.enum';
import { User } from 'src/users/Schemas/user.schema';
import { LogInDto } from './dtos/login.dto';
import { JwtPayload } from 'src/common/enums/interfaces/jwt-payload.interface';
import { use } from 'passport';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { RefreshTokenDto } from './dtos/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async Signup(signupData: SignUPDto) {
    const existing = await this.userService.findUsers(signupData.email);
    if (existing) {
      throw new BadRequestException('This email is already existing.');
    }
    const hashpassword = await bcrypt.hash(signupData.password, 10);
    const create: UserDto = {
      username: signupData.username,
      email: signupData.email,
      password: hashpassword,
      role: Role.USER,
    };
    const user = await this.userService.createUsers(create);
    const token = this.generateAccessToken(user);
    return {
      message: 'The user has been created',
      token,
      user: {
        id: user['_id'],
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async Login(loginData: LogInDto) {
    const user = await this.userService.findUsers(loginData.email);
    if (!user) {
      throw new UnauthorizedException('The user is not existing.');
    }
    const matchpass = await bcrypt.compare(loginData.password, user.password);
    if (!matchpass) {
      throw new UnauthorizedException('Wrong password');
    }
    const token = this.generateAccessToken(user);
    return {
      message: 'The user has been logged in',
      token,
      user: {
        id: user['_id'],
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  private async generateAccessToken(user: User) {
    const payload: JwtPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const accesstoken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_EXPIRES',
      ) as StringValue,
    });
    const refreshtoken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_REFRESH_EXPIRES',
      ) as StringValue,
    });
    const hashedrefreshtoken = await bcrypt.hash(refreshtoken, 10);
    user.hashedRefreshToken = hashedrefreshtoken;
    await user.save();
    return {
      accesstoken,
      refreshtoken,
    };
  }

  async refreshToken(refreshtokendata: RefreshTokenDto) {
    const { refreshtoken } = refreshtokendata;
    try {
      const payload = this.jwtService.verify(refreshtoken, {
        secret:this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      },);
      const user = await this.userService.findById(payload.id);
      if (!user) {
        throw new UnauthorizedException('The user is not found');
      }
      if (!user.hashedRefreshToken) {
        throw new UnauthorizedException('Refresh token is missing');
      }
      const isvalidrefreshtoken = await bcrypt.compare(
        refreshtoken,
        user.hashedRefreshToken,
      );
      if (!isvalidrefreshtoken) {
        throw new UnauthorizedException('Invalid Refresh Token');
      }
      return this.generateAccessToken(user);
    } catch {
      throw new UnauthorizedException('Invalid Refresh Token');
    }
  }
}
