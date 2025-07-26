// Adapter para arquivos locais
import { StorageAdapter } from './storage_adapter';
import fs from 'fs/promises';
import fss from 'fs';
import path from 'path';
import { Readable } from 'stream';

export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;

  constructor(baseDir: string = 'uploads') {
    this.baseDir = baseDir;
  }

  async upload(filePath: string, data: Readable): Promise<string> {
    const fullPath = path.join(this.baseDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    const writeStream = fss.createWriteStream(fullPath);
    await new Promise((resolve, reject) => {
      data.pipe(writeStream);
      writeStream.on('finish', () => resolve(undefined));
      writeStream.on('error', reject);
    });
    return `file://${fullPath}`;
  }

  async download(filePath: string): Promise<Readable> {
    const fullPath = path.join(this.baseDir, filePath);
    return fss.createReadStream(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath);
    await fs.unlink(fullPath);
  }

  async getPresignedPutUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    // Mock: retorna uma URL local simulando pré-assinada para upload
    return `file://${path.join(this.baseDir, filePath)}?put&expires=${Date.now() + expiresIn * 1000}`;
  }

  async getPresignedGetUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    // Mock: retorna uma URL local simulando pré-assinada para download
    return `file://${path.join(this.baseDir, filePath)}?get&expires=${Date.now() + expiresIn * 1000}`;
  }
}
