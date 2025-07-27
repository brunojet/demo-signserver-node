import { DynamoDBAdapter } from '../dynamodb_adapter';
import { createTestTable, deleteTestTable } from './test_dynamodb_utils';
import dotenv from 'dotenv';
dotenv.config();

// Configura endpoint local para o teste
process.env.DYNAMODB_ENDPOINT = 'http://localhost:8001';
process.env.DYNAMODB_REGION = 'us-east-1';
// Credenciais fake para DynamoDB local
process.env.AWS_ACCESS_KEY_ID = 'fake';
process.env.AWS_SECRET_ACCESS_KEY = 'fake';

// Entidade de teste

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


describe('DynamoDBAdapter', () => {
  const tableName = 'TestTable';
  let adapter: DynamoDBAdapter<TestEntity>;
  const entity: TestEntity = { id: '1', name: 'foo', value: 42 };

  beforeAll(async () => {
    await createTestTable(tableName);
    adapter = new DynamoDBAdapter<TestEntity>(tableName, toDynamoItem, fromDynamoItem);
  });

  afterAll(async () => {
    await deleteTestTable(tableName);
  });
  it('create deve inserir entidade', async () => {
    const result = await adapter.create(entity);
    expect(result).toEqual(entity);
  });

  it('findById deve retornar entidade', async () => {
    const result = await adapter.findById(entity.id);
    expect(result).toEqual(entity);
  });

  it('update deve atualizar entidade', async () => {
    const updated = await adapter.update(entity.id, { name: 'bar', value: 99 });
    expect(updated.name).toBe('bar');
    expect(updated.value).toBe(99);
    // Aguarda persistência do dado atualizado
    const check = await adapter.findById(entity.id);
    expect(check?.name).toBe('bar');
    expect(check?.value).toBe(99);
  });

  it('findByField deve buscar por campo', async () => {
    const results = await adapter.findByField('name', 'bar');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('bar');
  });

  it('findWhere deve buscar por múltiplos campos', async () => {
    const results = await adapter.findWhere({ name: 'bar', value: 99 });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('bar');
    expect(results[0].value).toBe(99);
  });

  it('list deve retornar entidades paginadas', async () => {
    const page = await adapter.list({ size: 10 });
    expect(page.content.length).toBeGreaterThan(0);
    expect(page.size).toBeGreaterThan(0);
    expect(page.hasNext).toBe(false); // Para poucos itens
  });

  it('list deve retornar nextPageToken e hasNext quando há paginação', async () => {
    // Mocka o método send para retornar LastEvaluatedKey
    const mockScan = {
      Items: [{ PK: { S: '2' }, name: { S: 'baz' }, value: { N: '123' } }],
      Count: 1,
      LastEvaluatedKey: { PK: { S: '2' } }
    };
    // Usa any para acessar client mesmo se for privado
    const spy = jest.spyOn((adapter as any).client, 'send').mockResolvedValueOnce(mockScan);

    const page = await (adapter as any).list({ size: 1 });
    expect(page.nextPageToken).toBeDefined();
    expect(page.hasNext).toBe(true);

    spy.mockRestore();
  });

  it('listFirstPage deve retornar primeira página', async () => {
    const page = await adapter.listFirstPage({ size: 10 });
    expect(page.content.length).toBeGreaterThan(0);
    expect(page.size).toBeGreaterThan(0);
  });

  it('delete deve remover entidade', async () => {
    await adapter.delete(entity.id);
    const result = await adapter.findById(entity.id);
    expect(result).toBeNull();
  });
});
