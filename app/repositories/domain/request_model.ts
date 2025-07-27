
// Model (Domain) para Request seguindo design Node.js

export enum RequestStatus {
  CREATED = "created",
  UPLOADED = "uploaded",
  SIGNING = "signing",
  SIGNED = "signed",
  SIGNED_AVAILABLE = "signed_available",
  DOWNLOAD_REQUESTED = "download_requested",
  SIGNING_FAILED = "signing_failed",
}

export class Request {
  public readonly id: string;
  public readonly profileId: string;
  public status: RequestStatus;
  public unsignedFile: {
    originalName: string;
    s3Key: string;
    size: number;
    contentType: string;
  };
  public signedFile?: {
    s3Key: string;
    size: number;
    contentType: string;
    signedAt: Date;
  };
  public webhookUrl?: string;
  public history: {
    timestamp: Date;
    status: RequestStatus;
    error?: {
      location: string;
      message: string;
    };
  }[];
  public company: string;
  public requestedBy: string;
  public processedBy?: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(params: {
    id: string;
    profileId: string;
    status: RequestStatus;
    unsignedFile: { originalName: string; s3Key: string; size: number; contentType: string };
    signedFile?: { s3Key: string; size: number; contentType: string; signedAt: Date };
    webhookUrl?: string;
    history: { timestamp: Date; status: RequestStatus; error?: { location: string; message: string } }[];
    company: string;
    requestedBy: string;
    processedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = params.id;
    this.profileId = params.profileId;
    this.status = params.status;
    this.unsignedFile = params.unsignedFile;
    this.signedFile = params.signedFile;
    this.webhookUrl = params.webhookUrl;
    this.history = params.history ?? [];
    this.company = params.company;
    this.requestedBy = params.requestedBy;
    this.processedBy = params.processedBy;
    this.createdAt = params.createdAt ?? new Date();
    this.updatedAt = params.updatedAt ?? new Date();
  }

  static create(params: Omit<Request, 'createdAt' | 'updatedAt'>): Request {
    return new Request({ ...params, createdAt: new Date(), updatedAt: new Date() });
  }

  update(data: Partial<Omit<Request, 'id' | 'profileId' | 'createdAt'>>): void {
    if (data.status) this.status = data.status;
    if (data.unsignedFile) this.unsignedFile = data.unsignedFile;
    if (data.signedFile) this.signedFile = data.signedFile;
    if (data.webhookUrl) this.webhookUrl = data.webhookUrl;
    if (data.history) this.history = data.history;
    if (data.company) this.company = data.company;
    if (data.requestedBy) this.requestedBy = data.requestedBy;
    if (data.processedBy) this.processedBy = data.processedBy;
    this.updatedAt = new Date();
  }
}
