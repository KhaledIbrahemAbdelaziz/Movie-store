import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Role } from 'src/common/enums/role.enum';
import { CreateMovieDto } from './Dtos/create-movie.dto';
import { Roles } from 'src/common/Decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UpdateMovieDto } from './Dtos/update-movie.dto';
import { PaginationDto } from 'src/common/Dtos/pagination.dto';
import { SearchMovieDto } from './Dtos/search-movie.dto';
import { IdempotencyInterceptor } from 'src/common/Interceptors/idempotency.interceptor';
import { Throttle } from '@nestjs/throttler';

@UseGuards(JwtAuthGuard)
@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  getMovies(@Query() paginationData: PaginationDto) {
    return this.movieService.findallmovies(paginationData);
  }

  @Get('search')
  searchmovie(@Query() searchmoviedata: SearchMovieDto) {
    return this.movieService.searchMovie(searchmoviedata);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.movieService.findspecificmovie(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  @Throttle({ movie: { ttl: 60000, limit: 20 } })
  createMovie(@Body() createmoviedata: CreateMovieDto) {
    return this.movieService.createmovies(createmoviedata);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateMovie(
    @Param('id') id: string,
    @Body() updatemoviedata: UpdateMovieDto) {
    return this.movieService.updatemovie(id, updatemoviedata);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deletemovie(@Param('id') id: string) {
    return this.movieService.deletemovie(id);
  }
}
