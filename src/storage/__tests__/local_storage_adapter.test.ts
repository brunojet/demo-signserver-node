import { LocalStorageAdapter } from '../local_storage_adapter';
import fs from 'fs/promises';
import fss from 'fs';
import path from 'path';
import { Readable } from 'stream';

describe('LocalStorageAdapter', () => {
  const adapter = new LocalStorageAdapter('test_uploads');
  const testFile = 'folder/test.txt';
  const testData = 'conteúdo de teste';

  afterAll(async () => {
    await fs.rm(path.join('test_uploads'), { recursive: true, force: true });
  });

  it('faz upload (stream) e retorna URL', async () => {
    const readable = Readable.from([testData]);
    const url = await adapter.upload(testFile, readable);
    expect(url).toContain('file://');
    const stream = await adapter.download(testFile);
    let result = '';
    await new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => result += chunk.toString());
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    expect(result).toBe(testData);
  });

  it('deleta arquivo', async () => {
    await adapter.upload(testFile, Readable.from([testData]));
    await adapter.delete(testFile);
    await expect(async () => {
      const stream = await adapter.download(testFile);
      await new Promise((resolve, reject) => {
        stream.on('error', resolve);
        stream.on('open', () => reject(new Error('Should not open')));
      });
    }).resolves.not.toThrow();
  });

  it('gera URL pré-assinada de upload (put)', async () => {
    const url = await adapter.getPresignedPutUrl(testFile, 60);
    expect(url).toContain('file://');
    expect(url).toContain('?put&expires=');
  });

  it('gera URL pré-assinada de download (get)', async () => {
    const url = await adapter.getPresignedGetUrl(testFile, 60);
    expect(url).toContain('file://');
    expect(url).toContain('?get&expires=');
  });
});
