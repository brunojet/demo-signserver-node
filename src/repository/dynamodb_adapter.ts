// Adapter para DynamoDB genérico
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { getDynamoClient } from './dynamodb_client';
import dotenv from 'dotenv';
dotenv.config();
import { RepositoryAdapter } from './repository_adapter';

export class DynamoDBAdapter<T> implements RepositoryAdapter<T> {
  private client: DynamoDBClient;
  private tableName: string;
  private toDynamoItem: (entity: T) => Record<string, any>;
  private fromDynamoItem: (item: Record<string, any>) => T;

  constructor(
    tableName: string,
    toDynamoItem: (entity: T) => Record<string, any>,
    fromDynamoItem: (item: Record<string, any>) => T
  ) {
    this.tableName = tableName;
    this.client = getDynamoClient();
    this.toDynamoItem = toDynamoItem;
    this.fromDynamoItem = fromDynamoItem;
  }

  async create(entity: T): Promise<T> {
    const item = this.toDynamoItem(entity);
    await this.client.send(new PutItemCommand({ TableName: this.tableName, Item: item }));
    return entity;
  }

  async findById(id: string): Promise<T | null> {
    const result = await this.client.send(
      new GetItemCommand({ TableName: this.tableName, Key: { PK: { S: id } } })
    );
    if (!result.Item) return null;
    return this.fromDynamoItem(result.Item as Record<string, any>);
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const current = await this.findById(id);
    if (!current) {
      throw new Error(`Entity with id ${id} not found for update.`);
    }
    const entity = { ...current, ...updates, id };
    await this.create(entity as T);
    return entity as T;
  }

  async delete(id: string): Promise<void> {
    await this.client.send(
      new DeleteItemCommand({ TableName: this.tableName, Key: { PK: { S: id } } })
    );
  }

  async findByField(field: string, value: any): Promise<T[]> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: `#field = :value`,
        ExpressionAttributeNames: { '#field': field },
        ExpressionAttributeValues: { ':value': { S: value } },
      })
    );
    return (result.Items || []).map((item: Record<string, any>) => this.fromDynamoItem(item));
  }

  async findWhere(conditions: Record<string, any>): Promise<T[]> {
    const names: Record<string, string> = {};
    const values: Record<string, any> = {};
    const exprs: string[] = [];
    Object.entries(conditions).forEach(([k, v], i) => {
      names[`#${k}`] = k;
      if (typeof v === 'number') {
        values[`:v${i}`] = { N: v.toString() };
      } else {
        values[`:v${i}`] = { S: v };
      }
      exprs.push(`#${k} = :v${i}`);
    });
    const result = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: exprs.join(' AND '),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      })
    );
    return (result.Items || []).map((item: Record<string, any>) => this.fromDynamoItem(item));
  }

  async list(options?: {
    size?: number;
    pageToken?: string;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<{ content: T[]; size: number; nextPageToken?: string; hasNext: boolean }> {
    const result = await this.client.send(
      new ScanCommand({ TableName: this.tableName, Limit: options?.size })
    );
    return {
      content: (result.Items || []).map((item: Record<string, any>) => this.fromDynamoItem(item)),
      size: result.Count || 0,
      nextPageToken: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined,
      hasNext: !!result.LastEvaluatedKey,
    };
  }

  async listFirstPage(options?: {
    size?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<{ content: T[]; size: number; nextPageToken?: string; hasNext: boolean }> {
    return this.list(options);
  }
}
