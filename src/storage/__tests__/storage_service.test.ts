import { StorageService } from '../storage_service';
import { StorageAdapter } from '../storage_adapter';
import { Readable } from 'stream';

describe('StorageService', () => {
  let mockAdapter: jest.Mocked<StorageAdapter>;
  let service: StorageService;

  beforeEach(() => {
    mockAdapter = {
      upload: jest.fn(async (filePath, data) => `url://${filePath}`),
      download: jest.fn(async (filePath) => Readable.from(['data'])),
      delete: jest.fn(async (filePath) => undefined),
      getPresignedPutUrl: jest.fn(async (filePath, expiresIn) => `put://${filePath}`),
      getPresignedGetUrl: jest.fn(async (filePath, expiresIn) => `get://${filePath}`),
    };
    service = new StorageService(mockAdapter);
  });

  it('logs and delegates upload', async () => {
    const stream = Readable.from(['test']);
    const result = await service.upload('file.txt', stream);
    expect(mockAdapter.upload).toHaveBeenCalledWith('file.txt', stream);
    expect(result).toBe('url://file.txt');
  });

  it('logs and delegates download', async () => {
    const result = await service.download('file.txt');
    expect(mockAdapter.download).toHaveBeenCalledWith('file.txt');
    expect(result).toBeInstanceOf(Readable);
  });

  it('logs and delegates delete', async () => {
    await service.delete('file.txt');
    expect(mockAdapter.delete).toHaveBeenCalledWith('file.txt');
  });

  it('logs and delegates getPresignedPutUrl', async () => {
    const result = await service.getPresignedPutUrl('file.txt', 123);
    expect(mockAdapter.getPresignedPutUrl).toHaveBeenCalledWith('file.txt', 123);
    expect(result).toBe('put://file.txt');
  });

  it('logs and delegates getPresignedGetUrl', async () => {
    const result = await service.getPresignedGetUrl('file.txt', 456);
    expect(mockAdapter.getPresignedGetUrl).toHaveBeenCalledWith('file.txt', 456);
    expect(result).toBe('get://file.txt');
  });

  it('logs error on upload failure', async () => {
    mockAdapter.upload.mockRejectedValueOnce(new Error('fail'));
    await expect(service.upload('file.txt', Readable.from(['test']))).rejects.toThrow('fail');
  });

  it('logs error on download failure', async () => {
    mockAdapter.download.mockRejectedValueOnce(new Error('fail'));
    await expect(service.download('file.txt')).rejects.toThrow('fail');
  });

  it('logs error on delete failure', async () => {
    mockAdapter.delete.mockRejectedValueOnce(new Error('fail'));
    await expect(service.delete('file.txt')).rejects.toThrow('fail');
  });
});
