import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Movie } from './Schemas/movie.schema';
import { Model } from 'mongoose';
import { CreateMovieDto } from './Dtos/create-movie.dto';
import { UpdateMovieDto } from './Dtos/update-movie.dto';
import { PaginationDto } from 'src/common/Dtos/pagination.dto';
import { SearchMovieDto } from './Dtos/search-movie.dto';

@Injectable()
export class MovieService {
  constructor(@InjectModel(Movie.name) private movieModel: Model<Movie>) {}

  async createmovies(createmoviedata: CreateMovieDto): Promise<Movie> {
    return await this.movieModel.create(createmoviedata);
  }

  async findallmovies(paginationData: PaginationDto) {
    const page = Number(paginationData.page) || 1;
    const limit = Number(paginationData.limit) || 10;
    const skip = (page - 1) * limit;
    const movies = await this.movieModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await this.movieModel.countDocuments();
    return {
      success: true,
      message: 'Movies Retrieved Successfully',
      data: {
        total,
        page,
        limit,
        results: movies,
      },
    };
  }

  async findspecificmovie(id: string): Promise<Movie | null> {
    return this.movieModel.findById(id);
  }

  async updatemovie(
    id: string,
    updatemoviedata: UpdateMovieDto,
  ): Promise<Movie | null> {
    const movie = await this.movieModel.findByIdAndUpdate(id, updatemoviedata, {
      new: true,
    });
    if (!movie) {
      throw new NotFoundException('The movie is not found');
    }
    return movie;
  }

  async deletemovie(id: string) {
    const movie = await this.movieModel.findByIdAndDelete(id);
    if (!movie) {
      throw new NotFoundException('The movie is not found');
    }
  }

  async searchMovie(searchmovieData: SearchMovieDto) {
    const query: Record<string, unknown> = {};
    if (searchmovieData.title) {
      query.title = {
        $regex: searchmovieData.title,
        $options: 'i',
      };
    }
    if (searchmovieData.genre) {
      query.genre = {
        $regex: searchmovieData.genre,
        $options: 'i',
      };
    }
    return this.movieModel.find(query);
  }
}
