import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Idempotency extends Document {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  endpoint: string;

  @Prop({ type: Object })
  response?: Record<string, unknown>;

  @Prop({ required: true, default: false })
  completed: boolean;
}

export const IdempotencySchema = SchemaFactory.createForClass(Idempotency);
IdempotencySchema.index(
  {
    key: 1,
    endpoint: 1,
  },
  {
    unique: true,
  },
);
