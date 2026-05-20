import { IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateMovieDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  ReleasedYear: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  rating: number;

  @IsString()
  genre: string;
}
