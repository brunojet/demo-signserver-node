
import { Request } from './domain/request_model';

export interface IRequestRepository {
  create(request: Request): Promise<Request>;
  findById(id: string): Promise<Request | null>;
  findByProfileId(profileId: string): Promise<Request[]>;
  update(id: string, data: Partial<Request>): Promise<Request | null>;
  delete(id: string): Promise<void>;
  list(params?: { status?: string; size?: number; }): Promise<Request[]>;
}

export class RequestRepository implements IRequestRepository {
  // Aqui você pode injetar o adapter ou client do banco
  // constructor(private adapter: DynamoDBAdapter<Request>) {}

  async create(request: Request): Promise<Request> {
    // Implementação real aqui
    return request;
  }

  async findById(id: string): Promise<Request | null> {
    // Implementação real aqui
    return null;
  }

  async findByProfileId(profileId: string): Promise<Request[]> {
    // Implementação real aqui
    return [];
  }

  async update(id: string, data: Partial<Request>): Promise<Request | null> {
    // Implementação real aqui
    return null;
  }

  async delete(id: string): Promise<void> {
    // Implementação real aqui
  }

  async list(params?: { status?: string; size?: number; }): Promise<Request[]> {
    // Implementação real aqui
    return [];
  }
}
