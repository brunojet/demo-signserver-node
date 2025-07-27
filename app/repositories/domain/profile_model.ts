

import { BaseModel } from './base_model';

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
  public name!: string;
  public description!: string;
  public signer!: SignerType;
  public signerParams?: Record<string, any>;
  public uploadConfig!: TransferConfig;
  public downloadConfig!: TransferConfig;
  public isActive!: boolean;

  toDynamoSnake(): Record<string, any> {
    return {
      ...this.toBaseSnake(),
      name: this.name,
      description: this.description,
      signer: this.signer,
      signer_params: this.signerParams,
      upload_config: {
        url: this.uploadConfig?.url,
        max_retries: this.uploadConfig?.maxRetries,
        interval_seconds: this.uploadConfig?.intervalSeconds
      },
      download_config: {
        url: this.downloadConfig?.url,
        max_retries: this.downloadConfig?.maxRetries,
        interval_seconds: this.downloadConfig?.intervalSeconds
      },
      is_active: this.isActive
    };
  }

  // Conversão manual de snake_case para camelCase
  fromDynamoSnake(item: Record<string, any>): Profile {
    this.fromBaseSnake(item);
    this.name = item.name;
    this.description = item.description;
    this.signer = item.signer;
    this.signerParams = item.signer_params;
    this.uploadConfig = {
      url: item.upload_config?.url,
      maxRetries: item.upload_config?.max_retries,
      intervalSeconds: item.upload_config?.interval_seconds
    };
    this.downloadConfig = {
      url: item.download_config?.url,
      maxRetries: item.download_config?.max_retries,
      intervalSeconds: item.download_config?.interval_seconds
    };
    this.isActive = item.is_active;
    return this;
  }

}
