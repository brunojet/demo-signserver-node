import { Request, FileInfo, HistoryEntry, RequestStatus } from '../request_model';

describe('Request Model', () => {

  it('toSnake should not include undefined fields', () => {
    const req = new Request();
    const snake = req.toSnake();
    expect(snake).toEqual({});
  });

  it('fromSnake should handle missing unsignedFile/signedFile', () => {
    const snake = {
      profile_id: 'p3',
      company_id: 'c3',
      status: 'failed'
    };
    const req = new Request().fromSnake(snake);
    expect(req.profileId).toBe('p3');
    expect(req.companyId).toBe('c3');
    expect(req.status).toBe('failed');
    expect(req.unsignedFile).toBeUndefined();
    expect(req.signedFile).toBeUndefined();
  });


  it('fromSnake should not fail with empty object', () => {
    const req = new Request().fromSnake({});
    expect(req.profileId).toBeUndefined();
    expect(req.unsignedFile).toBeUndefined();
    expect(req.signedFile).toBeUndefined();
  });
  
  it('toSnake should include userTokenId and webhookUrl', () => {
    const req = new Request();
    req.userTokenId = 'token123';
    req.webhookUrl = 'http://webhook';
    const snake = req.toSnake();
    expect(snake.user_token_id).toBe('token123');
    expect(snake.webhook_url).toBe('http://webhook');
  });
  
  it('toSnake should serialize unsignedFile and signedFile', () => {
    const req = new Request();
    req.unsignedFile = { storage: 's3', filePath: '/file1', size: 100, contentType: 'pdf' };
    req.signedFile = { storage: 'gcs', filePath: '/file2', size: 200, contentType: 'txt' };
    const snake = req.toSnake();
    expect(snake.unsigned_file).toEqual({ storage: 's3', file_path: '/file1', size: 100, content_type: 'pdf' });
    expect(snake.signed_file).toEqual({ storage: 'gcs', file_path: '/file2', size: 200, content_type: 'txt' });
  });
  
  it('toSnake should serialize history with and without error', () => {
    const req = new Request();
    req.history = [
      { timestamp: new Date('2023-01-01T00:00:00Z'), status: RequestStatus.CREATED },
      { timestamp: new Date('2023-01-02T00:00:00Z'), status: RequestStatus.FAILED, error: { errorLocation: 'loc', errorMessage: 'msg' } }
    ];
    const snake = req.toSnake();
    expect(Array.isArray(snake.history)).toBe(true);
    expect(snake.history.length).toBe(2);
    expect(snake.history[0]).toMatchObject({ status: 'created' });
    expect(snake.history[1].error).toEqual({ location: 'loc', message: 'msg' });
  });
  
  it('fromSnake should populate all fields', () => {
    const snake = {
      user_token_id: 'tokenX',
      profile_id: 'profileX',
      company_id: 'companyX',
      status: 'signed',
      webhook_url: 'http://webhook',
      unsigned_file: { storage: 's3', file_path: '/fileA', size: 10, content_type: 'pdf' },
      signed_file: { storage: 'gcs', file_path: '/fileB', size: 20, content_type: 'txt' },
      history: [
        { timestamp: new Date('2023-01-01T00:00:00Z'), status: RequestStatus.CREATED },
        { timestamp: new Date('2023-01-02T00:00:00Z'), status: RequestStatus.FAILED, error: { location: 'loc', message: 'msg' } }
      ]
    };
    const req = new Request().fromSnake(snake);
    expect(req.userTokenId).toBe('tokenX');
    expect(req.profileId).toBe('profileX');
    expect(req.companyId).toBe('companyX');
    expect(req.status).toBe('signed');
    expect(req.webhookUrl).toBe('http://webhook');
    expect(req.unsignedFile).toEqual({ storage: 's3', filePath: '/fileA', size: 10, contentType: 'pdf' });
    expect(req.signedFile).toEqual({ storage: 'gcs', filePath: '/fileB', size: 20, contentType: 'txt' });
    expect(Array.isArray(req.history)).toBe(true);
    expect(req.history?.length).toBe(2);
    expect(req.history?.[1].error).toEqual({ errorLocation: 'loc', errorMessage: 'msg' });
  });
});
