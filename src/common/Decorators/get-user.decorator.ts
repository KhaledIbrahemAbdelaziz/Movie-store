import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const reqs = context.switchToHttp().getRequest();
    return reqs.user;
  },
);
