import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { getDynamoClient, getDynamoClientNoCache } from '../dynamodb_client';

function configureEnv() {
  process.env.DYNAMODB_ENDPOINT = 'http://localhost:8001';
  process.env.DYNAMODB_REGION = 'us-east-1';
  process.env.AWS_ACCESS_KEY_ID = 'fakeAccessKey';
  process.env.AWS_SECRET_ACCESS_KEY = 'fakeSecretKey';
  process.env.AWS_SESSION_TOKEN = 'fakeSessionToken';
}

it('should return a valid DynamoDBClient instance', () => {
  configureEnv();
  const client1 = getDynamoClient();
  const client2 = getDynamoClient();
  expect(client1).toBeInstanceOf(DynamoDBClient);
  expect(client2).toBeInstanceOf(DynamoDBClient);
  expect(client1).toBe(client2);
});

it('should use the correct endpoint and credentials', async () => {
  configureEnv();
  const client = getDynamoClient();
  let configObj = client.config;
  let credsObj = await configObj?.credentials();
  let endpointObj = await configObj?.endpoint?.();
  expect(endpointObj?.hostname).toBe('localhost');
  expect(await configObj?.region()).toBe('us-east-1');
  expect(credsObj.accessKeyId).toBe('fakeAccessKey');
  expect(credsObj.secretAccessKey).toBe('fakeSecretKey');
  expect(credsObj.sessionToken).toBe('fakeSessionToken');
});

it('should create client with only region if endpoint is not set', async () => {
  configureEnv();
  delete process.env.DYNAMODB_ENDPOINT;
  process.env.DYNAMODB_REGION = 'us-west-2';
  const client = getDynamoClientNoCache();
  let configObj = client.config;
  expect(await configObj.region()).toBe('us-west-2');
  let endpointObj = await configObj.endpoint?.();
  expect(endpointObj?.hostname).not.toBe('localhost');
});

// Singleton não é mais responsabilidade do client

it('should use all defaults if no envs are set', () => {
  configureEnv();
  delete process.env.DYNAMODB_ENDPOINT;
  delete process.env.DYNAMODB_REGION;
  const client = getDynamoClientNoCache();
  expect(client).toBeDefined();
});

it('should use only endpoint if set', async () => {
  configureEnv();
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;
  delete process.env.AWS_SESSION_TOKEN;
  const client = getDynamoClientNoCache();
  expect(client).toBeDefined();
});
