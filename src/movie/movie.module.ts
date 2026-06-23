import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './Schemas/movie.schema';
import { AuthModule } from 'src/auth/auth.module';
import { IdempotencyModule } from 'src/idempotency/idempotency.module';
import { IdempotencyInterceptor } from 'src/common/Interceptors/idempotency.interceptor';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
    AuthModule,
    IdempotencyModule,
  ],
  controllers: [MovieController],
  providers: [MovieService, IdempotencyInterceptor],
})
export class MovieModule {}
