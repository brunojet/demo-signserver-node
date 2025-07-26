import { Readable } from 'stream';
import { logger } from '../observability/observability';
import { StorageAdapter } from './storage_adapter';

export class StorageService implements StorageAdapter {
  private adapter: StorageAdapter;

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  async upload(filePath: string, data: Readable): Promise<string> {
    logger.info('Storage: upload iniciado', { filePath });
    try {
      const result = await this.adapter.upload(filePath, data);
      logger.info('Storage: upload concluído', { filePath });
      return result;
    } catch (err) {
      logger.error('Storage: erro no upload', { filePath, error: err });
      throw err;
    }
  }

  async download(filePath: string): Promise<Readable> {
    logger.info('Storage: download iniciado', { filePath });
    try {
      const result = await this.adapter.download(filePath);
      logger.info('Storage: download concluído', { filePath });
      return result;
    } catch (err) {
      logger.error('Storage: erro no download', { filePath, error: err });
      throw err;
    }
  }

  async delete(filePath: string): Promise<void> {
    logger.info('Storage: delete iniciado', { filePath });
    try {
      await this.adapter.delete(filePath);
      logger.info('Storage: arquivo deletado', { filePath });
    } catch (err: any) {
      logger.error('Storage: erro ao deletar arquivo', { filePath, error: err });
      throw err;
    }
  }

  async getPresignedPutUrl(filePath: string, expiresIn?: number): Promise<string> {
    logger.debug('Storage: getPresignedPutUrl', { filePath, expiresIn });
    return this.adapter.getPresignedPutUrl(filePath, expiresIn);
  }

  async getPresignedGetUrl(filePath: string, expiresIn?: number): Promise<string> {
    logger.debug('Storage: getPresignedGetUrl', { filePath, expiresIn });
    return this.adapter.getPresignedGetUrl(filePath, expiresIn);
  }
}
