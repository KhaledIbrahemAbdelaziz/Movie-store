import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Idempotency } from './Schemas/idempotency.schema';
import { Model } from 'mongoose';

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectModel(Idempotency.name)
    private readonly IdempotencyModel: Model<Idempotency>,
  ) {}

  async acquireLock(key: string, endpoint: string) {
    try {
      const document = await this.IdempotencyModel.create({
        key,
        endpoint,
        completed: false,
      });
      return { acquired: true, document };
    } catch {
      const existing = await this.IdempotencyModel.findOne({ key, endpoint });
      return { acquired: false, document: existing };
    }
  }

  async saveResponse(id: string, response: Record<string, unknown>) {
    await this.IdempotencyModel.findByIdAndUpdate(id, {
      response,
      completed: true,
    });
  }
}
