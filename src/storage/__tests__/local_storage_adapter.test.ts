import { LocalStorageAdapter } from '../local_storage_adapter';

describe('LocalStorageAdapter', () => {
  const baseDir = 'test-uploads';
  const adapter = new LocalStorageAdapter(baseDir);
  const testFile = 'file.txt';
  const testContent = 'conteudo';

  afterAll(async () => {
    const fs = await import('fs/promises');
    await fs.rm(baseDir, { recursive: true, force: true });
  });

  it('upload e download funcionam', async () => {
    const { Readable } = await import('stream');
    const readable = Readable.from([testContent]);
    const url = await adapter.upload(testFile, readable);
    expect(url).toContain(testFile);
    const stream = await adapter.download(testFile);
    let data = '';
    for await (const chunk of stream) data += chunk;
    expect(data).toBe(testContent);
  });

  it('delete remove arquivo', async () => {
    const { Readable } = await import('stream');
    await adapter.upload('del.txt', Readable.from(['del']));
    await adapter.delete('del.txt');
    const fs = await import('fs/promises');
    const path = await import('path');
    await expect(fs.access(path.join(baseDir, 'del.txt'))).rejects.toThrow();
  });

  it('getPresignedPutUrl retorna url simulada', async () => {
    const url = await adapter.getPresignedPutUrl('put.txt', 10);
    expect(url).toContain('put');
    expect(url).toContain('expires=');
  });

  it('getPresignedGetUrl retorna url simulada', async () => {
    const url = await adapter.getPresignedGetUrl('get.txt', 10);
    expect(url).toContain('get');
    expect(url).toContain('expires=');
  });
});
