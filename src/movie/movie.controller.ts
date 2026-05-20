import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MovieService } from './movie.service';
import { JwtAuthGuard } from 'src/common/enums/guards/jwt-auth.guard';
import { Role } from 'src/common/enums/role.enum';
import { CreateMovieDto } from './Dtos/create-movie.dto';
import { Roles } from 'src/common/enums/Decorators/roles.decorator';
import { RolesGuard } from 'src/common/enums/guards/roles.guard';
import { UpdateMovieDto } from './Dtos/update-movie.dto';
import { PaginationDto } from 'src/common/enums/Dtos/pagination.dto';

@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  getMovies(@Query() paginationData: PaginationDto) {
    return this.movieService.findallmovies(paginationData);
  }

  @Get(':id')
  getMovie(id: string) {
    return this.movieService.findspecificmovie(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
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
