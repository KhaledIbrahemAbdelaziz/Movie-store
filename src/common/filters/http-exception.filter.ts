import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const res = ctx.getResponse();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    res.status(status).json({
      sucess: false,
      message: exception.message || 'Internal Server Error',
      data: null,
    });
  }
}
 