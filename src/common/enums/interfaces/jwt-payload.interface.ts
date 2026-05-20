import { Role } from '../role.enum';

export interface JwtPayload {
  id: string;

  email: string;

  role: Role;
}
