import { RepositoryService } from '../repository_service';
import { DynamoDBAdapter } from '../dynamodb_adapter';
import { createTestTable, deleteTestTable } from './test_dynamodb_utils';
import dotenv from 'dotenv';
dotenv.config();

process.env.DYNAMODB_ENDPOINT = 'http://localhost:8001';
process.env.DYNAMODB_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'fake';
process.env.AWS_SECRET_ACCESS_KEY = 'fake';

interface TestEntity {
  id: string;
  name: string;
  value: number;
}

function toDynamoItem(entity: TestEntity): Record<string, any> {
  return {
    PK: { S: entity.id },
    name: { S: entity.name },
    value: { N: entity.value.toString() },
  };
}

function fromDynamoItem(item: Record<string, any>): TestEntity {
  return {
    id: item.PK.S,
    name: item.name.S,
    value: Number(item.value.N),
  };
}

describe('RepositoryService', () => {
  const tableName = 'TestTableService';
  let service: RepositoryService<TestEntity>;
  const entity: TestEntity = { id: '1', name: 'foo', value: 42 };

  beforeAll(async () => {
    await createTestTable(tableName);
    const adapter = new DynamoDBAdapter<TestEntity>(tableName, toDynamoItem, fromDynamoItem);
    service = new RepositoryService(adapter);
  });

  afterAll(async () => {
    await deleteTestTable(tableName);
  });

  it('create deve inserir entidade', async () => {
    const result = await service.create(entity);
    expect(result).toEqual(entity);
  });

  it('findById deve retornar entidade', async () => {
    const result = await service.findById(entity.id);
    expect(result).toEqual(entity);
  });

  it('update deve atualizar entidade', async () => {
    const updated = await service.update(entity.id, { name: 'bar', value: 99 });
    expect(updated.name).toBe('bar');
    expect(updated.value).toBe(99);
    const check = await service.findById(entity.id);
    expect(check?.name).toBe('bar');
    expect(check?.value).toBe(99);
  });

  it('findByField deve buscar por campo', async () => {
    const results = await service.findByField('name', 'bar');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('bar');
  });

  it('findWhere deve buscar por múltiplos campos', async () => {
    const results = await service.findWhere({ name: 'bar', value: 99 });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('bar');
    expect(results[0].value).toBe(99);
  });

  it('list deve retornar entidades paginadas', async () => {
    const page = await service.list({ size: 10 });
    expect(page.content.length).toBeGreaterThan(0);
    expect(page.size).toBeGreaterThan(0);
    expect(page.hasNext).toBe(false);
  });

  it('listFirstPage deve retornar primeira página', async () => {
    const page = await service.listFirstPage({ size: 10 });
    expect(page.content.length).toBeGreaterThan(0);
    expect(page.size).toBeGreaterThan(0);
  });

  it('delete deve remover entidade', async () => {
    await service.delete(entity.id);
    const result = await service.findById(entity.id);
    expect(result).toBeNull();
  });
});
