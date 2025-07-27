
import { BaseModel } from './base_model';
import { toSnake, fromSnake as fromSnakeUtil } from './snake_utils';

// Model (Domain) para Request seguindo design Node.js

export class FileInfo {
  public storage!: string;
  public filePath!: string;
  public size!: number;
  public contentType!: string;
}

export class HistoryEntry {
  public timestamp!: Date;
  public status!: RequestStatus;
  public error?: {
    errorLocation: string;
    errorMessage: string;
  };
}

export enum RequestStatus {
  CREATED = "created",
  RECEIVED = "received",
  SIGNING = "signing",
  SIGNED = "signed",
  FAILED = "failed",
}

export class Request extends BaseModel {
  public userTokenId?: string;
  public profileId?: string;
  public companyId?: string;
  public status?: RequestStatus;
  public history?: HistoryEntry[];
  public unsignedFile?: FileInfo;
  public signedFile?: FileInfo;
  public webhookUrl?: string;

  toSnake(): Record<string, any> {
    const base = toSnake(this);
    // unsignedFile e signedFile são objetos, converter manualmente
    if (this.unsignedFile) {
      base.unsigned_file = toSnake(this.unsignedFile);
    }
    if (this.signedFile) {
      base.signed_file = toSnake(this.signedFile);
    }
    // history é array de objetos
    if (this.history) {
      base.history = this.history.map(h => {
        const entry = toSnake(h);
        if (h.error) entry.error = toSnake({
          errorLocation: h.error.errorLocation,
          errorMessage: h.error.errorMessage
        });
        return entry;
      });
    }
    return base;
  }

  fromSnake(item: Record<string, any>): Request {
    const camel = fromSnakeUtil(item);
    Object.assign(this, camel);
    // unsignedFile e signedFile são objetos, converter manualmente
    this.unsignedFile = item.unsigned_file ? fromSnakeUtil(item.unsigned_file) as FileInfo : undefined;
    this.signedFile = item.signed_file ? fromSnakeUtil(item.signed_file) as FileInfo : undefined;
    // history é array de objetos
    this.history = item.history ? item.history.map((h: any) => {
      const entry = fromSnakeUtil(h) as HistoryEntry;
      if (h.error) entry.error = fromSnakeUtil(h.error) as { errorLocation: string; errorMessage: string };
      return entry;
    }) : undefined;
    return this;
  }
}
