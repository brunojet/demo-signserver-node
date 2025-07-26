import { LocalStorageAdapter } from '../local_storage_adapter';
import fs from 'fs/promises';
import path from 'path';

describe('LocalStorageAdapter', () => {
  const adapter = new LocalStorageAdapter('test_uploads');
  const testFile = 'folder/test.txt';
  const testData = Buffer.from('conteúdo de teste');

  afterAll(async () => {
    await fs.rm(path.join('test_uploads'), { recursive: true, force: true });
  });

  it('faz upload e retorna URL', async () => {
    const url = await adapter.upload(testFile, testData);
    expect(url).toContain('file://');
    const data = await adapter.download(testFile);
    expect(data.toString()).toBe('conteúdo de teste');
  });

  it('deleta arquivo', async () => {
    await adapter.upload(testFile, testData);
    await adapter.delete(testFile);
    await expect(adapter.download(testFile)).rejects.toThrow();
  });
});
