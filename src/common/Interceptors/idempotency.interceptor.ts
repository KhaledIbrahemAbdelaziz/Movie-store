import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, mergeMap, Observable } from 'rxjs';
import { IdempotencyService } from 'src/idempotency/idempotency.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotencyService: IdempotencyService) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    const key = request.headers['idempotency-key'];
    if (!key) {
      return next.handle();
    }

    const endpoint = request.originalUrl;

    return from(this.idempotencyService.acquireLock(key, endpoint)).pipe(
      mergeMap((result) => {
        if (!result.acquired) {
          if (result.document?.completed) {
            return from([result.document.response]);
          }

          throw new ConflictException('Request already processing');
        }

        return next.handle().pipe(
          mergeMap(async (response) => {
            await this.idempotencyService.saveResponse(
              result.document!._id.toString(),
              response as Record<string, unknown>,
            );
            return response;
          }),
        );
      }),
    );
  }
}
