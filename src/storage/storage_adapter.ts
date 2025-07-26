// Interface genérica para storage
import { Readable } from 'stream';

export interface StorageAdapter {
  upload(filePath: string, data: Readable): Promise<string>; // retorna URL
  download(filePath: string): Promise<Readable>;
  delete(filePath: string): Promise<void>;
  getPresignedPutUrl(filePath: string, expiresIn?: number): Promise<string>;
  getPresignedGetUrl(filePath: string, expiresIn?: number): Promise<string>;
}
