

import { BaseModel } from './base_model';
import { toSnake, fromSnake } from './snake_utils';

export class TransferConfig {
  public url!: string;
  public maxRetries!: number;
  public intervalSeconds!: number;
}

export enum SignerType {
  POSITIVO = "positivo",
  GERTEC = "gertec",
}

export class Profile extends BaseModel {
  public name?: string;
  public description?: string;
  public signer?: SignerType;
  public signerParams?: Record<string, any>;
  public uploadConfig?: TransferConfig;
  public downloadConfig?: TransferConfig;
  public isActive?: boolean;

  toSnake(): Record<string, any> {
    const result: Record<string, any> = { ...this.toBaseSnake(), ...toSnake(this) };
    if (this.uploadConfig != null) {
      result.upload_config = toSnake(this.uploadConfig);
    }
    if (this.downloadConfig != null) {
      result.download_config = toSnake(this.downloadConfig);
    }
    return result;
  }

  fromSnake(item: Record<string, any>): Profile {
    this.fromBaseSnake(item);
    const mapped = fromSnake(item);
    Object.assign(this, mapped);
    if (item.upload_config) {
      this.uploadConfig = Object.assign(new TransferConfig(), fromSnake(item.upload_config));
    }
    if (item.download_config) {
      this.downloadConfig = Object.assign(new TransferConfig(), fromSnake(item.download_config));
    }
    return this;
  }

}
