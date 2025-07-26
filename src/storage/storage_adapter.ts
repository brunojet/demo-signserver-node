// Interface genérica para storage
export interface StorageAdapter {
  upload(filePath: string, data: Buffer): Promise<string>; // retorna URL
  download(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
}
