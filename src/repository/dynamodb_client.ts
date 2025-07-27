import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

let _dynamoClient: DynamoDBClient | null = null;

function getDynamoInternal(): DynamoDBClient {
  const endpoint = process.env.DYNAMODB_ENDPOINT;
  const region = process.env.DYNAMODB_REGION || 'us-east-1';
  if (endpoint) {
    return new DynamoDBClient({
      endpoint,
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fakeAccessKey',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fakeSecretKey',
        sessionToken: process.env.AWS_SESSION_TOKEN || 'fakeSessionToken',
      },
    });
  } else {
    return new DynamoDBClient({ region });
  }
}

export function getDynamoClient(): DynamoDBClient {
  if (!_dynamoClient) {
    _dynamoClient = getDynamoInternal();
  }
  return _dynamoClient;
}

export function getDynamoClientNoCache(): DynamoDBClient {
  return getDynamoInternal();
}
