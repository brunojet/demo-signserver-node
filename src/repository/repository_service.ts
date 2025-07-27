// Serviço Repository genérico que recebe um adapter
import { RepositoryAdapter } from './repository_adapter';

export class RepositoryService<T> {
  private adapter: RepositoryAdapter<T>;

  constructor(adapter: RepositoryAdapter<T>) {
    this.adapter = adapter;
  }

  create(entity: T) {
    return this.adapter.create(entity);
  }

  findById(id: string) {
    return this.adapter.findById(id);
  }

  update(id: string, updates: Partial<T>) {
    return this.adapter.update(id, updates);
  }

  delete(id: string) {
    return this.adapter.delete(id);
  }

  findByField(field: string, value: any) {
    return this.adapter.findByField(field, value);
  }

  findWhere(conditions: Record<string, any>) {
    return this.adapter.findWhere(conditions);
  }

  list(options?: {
    size?: number;
    pageToken?: string;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }) {
    return this.adapter.list(options);
  }

  listFirstPage(options?: { size?: number; orderBy?: string; orderDirection?: 'ASC' | 'DESC' }) {
    return this.adapter.listFirstPage(options);
  }
}
