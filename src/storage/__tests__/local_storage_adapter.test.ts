import { LocalStorageAdapter as StorageService } from '../local_storage_adapter';

describe('LocalStorageAdapter', () => {
  const baseDir = 'test-uploads';
  const adapter = new StorageService(baseDir);
  const testFile = 'file.txt';
  const testContent = 'conteudo';

  afterAll(async () => {
    const fs = await import('fs/promises');
    try {
      await fs.rm(baseDir, { recursive: true, force: true });
    } catch (err) {
      // ignora erro se diretório já foi removido
    }
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

  it('upload lança erro se stream falhar', async () => {
    const { Readable } = await import('stream');
    const broken = new Readable({ read() { this.destroy(new Error('fail')); } });
    await expect(adapter.upload('fail.txt', broken)).rejects.toThrow('fail');
  });

  it('download lança erro se arquivo não existe', async () => {
    await expect(adapter.download('inexistente.txt')).rejects.toThrow();
  });

  it('delete lança erro se arquivo não existe', async () => {
    await expect(adapter.delete('inexistente.txt')).rejects.toThrow();
  });

  it('getPresignedPutUrl funciona sem expiresIn', async () => {
    const url = await adapter.getPresignedPutUrl('put2.txt');
    expect(url).toContain('put2.txt');
    expect(url).toContain('expires=');
  });

  it('getPresignedGetUrl funciona sem expiresIn', async () => {
    const url = await adapter.getPresignedGetUrl('get2.txt');
    expect(url).toContain('get2.txt');
    expect(url).toContain('expires=');
  });

  it('usa valor padrão de baseDir se não informado', () => {
    const adapterDefault = new StorageService();
    expect((adapterDefault as any).baseDir).toBe('uploads');
  });
});
