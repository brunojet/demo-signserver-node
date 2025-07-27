// Métodos utilitários para conversão camelCase <-> snake_case dos campos base
export abstract class BaseModel {
  public id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  toBaseSnake(): Record<string, any> {
    return {
      id: this.id,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  fromBaseSnake(item: Record<string, any>): void {
    this.id = item.id;
    this.createdAt = item.created_at;
    this.updatedAt = item.updated_at;
  }
}
