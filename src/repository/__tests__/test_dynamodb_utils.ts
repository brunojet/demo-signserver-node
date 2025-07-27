import {
  CreateTableCommand,
  DeleteTableCommand,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { getDynamoClient } from '../dynamodb_client';

export async function createTestTable(tableName: string) {
  const client = getDynamoClient();
  try {
    await client.send(
      new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: [{ AttributeName: 'PK', AttributeType: 'S' }],
        KeySchema: [{ AttributeName: 'PK', KeyType: 'HASH' }],
        BillingMode: 'PAY_PER_REQUEST',
      })
    );
    // Aguarda tabela ficar disponível
    await waitUntilTableExists({ client, maxWaitTime: 60 }, { TableName: tableName });
  } catch (err: any) {
    if (!err.message?.includes('Table already exists')) {
      throw err;
    }
  }
}

export async function deleteTestTable(tableName: string) {
  const client = getDynamoClient();
  try {
    await client.send(new DeleteTableCommand({ TableName: tableName }));
  } catch (err: any) {
    if (!err.message?.includes('Cannot do operations on a non-existent table')) {
      throw err;
    }
  }
}
