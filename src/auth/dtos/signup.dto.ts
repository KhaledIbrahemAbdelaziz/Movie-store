import { IsEmail, IsEnum, IsString, Matches, MinLength } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class SignUPDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[0-9])/, {
    message: 'Password must contain at least one number',
  })
  password: string;

  @IsEnum(Role)
  role: Role;
}
