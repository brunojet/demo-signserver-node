// Interface genérica para repository
export interface RepositoryAdapter<T> {
  create(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  findByField(field: string, value: any): Promise<T[]>;
  findWhere(conditions: Record<string, any>): Promise<T[]>;
  list(options?: {
    size?: number;
    pageToken?: string;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<{ content: T[]; size: number; nextPageToken?: string; hasNext: boolean }>;
  listFirstPage(options?: {
    size?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<{ content: T[]; size: number; nextPageToken?: string; hasNext: boolean }>;
}
