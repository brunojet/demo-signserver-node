// Adapter para DynamoDB genérico
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { buildUpdateExpression, buildFilterExpression } from './dynamodb_utils';
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
      const updateExpr = buildUpdateExpression(updates);
    // Add condition expression directly here to ensure PK exists
    const conditionExpr = {
      ConditionExpression: 'attribute_exists(PK)'
    };
    try {
      const response = await this.client.send(new UpdateItemCommand({
        TableName: this.tableName,
        Key: { PK: { S: id } },
        ...updateExpr,
        ...conditionExpr,
        ReturnValues: 'ALL_NEW'
      }));
        !response.Attributes ||
        typeof response.Attributes !== 'object' ||
        response.Attributes === null ||
        (Object.keys(response.Attributes).length === 0)
      ) {
        throw new Error(`Entity with id ${id} not found after update.`);
      }
      return this.fromDynamoItem(response.Attributes as Record<string, any>);
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        throw new Error(`Entity with id ${id} not found after update.`);
      }
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    await this.client.send(
      new DeleteItemCommand({ TableName: this.tableName, Key: { PK: { S: id } } })
    );
  }

  async findByField(field: string, value: any): Promise<T[]> {
    const filterExpr = buildFilterExpression({ [field]: value });
    const result = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
        ...filterExpr,
      })
    );
    return (result.Items || []).map((item: Record<string, any>) => this.fromDynamoItem(item));
  }

  async findWhere(conditions: Record<string, any>): Promise<T[]> {
    const filterExpr = buildFilterExpression(conditions);
    const result = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
        ...filterExpr,
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
