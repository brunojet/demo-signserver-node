// Adapter para arquivos locais
import { StorageAdapter } from './storage_adapter';
import fs from 'fs/promises';
import path from 'path';

export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;

  constructor(baseDir: string = 'uploads') {
    this.baseDir = baseDir;
  }

  async upload(filePath: string, data: Buffer): Promise<string> {
    const fullPath = path.join(this.baseDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
    // Retorna URL local (mock)
    return `file://${fullPath}`;
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, filePath);
    return fs.readFile(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath);
    await fs.unlink(fullPath);
  }
}
