import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Movie extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  ReleasedYear: number;

  @Prop({ required: true })
  rating: number;

  @Prop({ required: true })
  genre: string;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);
