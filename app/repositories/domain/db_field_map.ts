// Mapa global para normalização de campos camelCase <-> snake_case
export const dbFieldMap: Record<string, string> = {
  // Error (HistoryEntry)
  errorLocation: 'location',
  errorMessage: 'message',
  // FileInfo
  storage: 'storage',
  filePath: 'file_path',
  size: 'size',
  contentType: 'content_type',
  // Profile
  name: 'name',
  description: 'description',
  signer: 'signer',
  signerParams: 'signer_params',
  uploadConfig: 'upload_config',
  downloadConfig: 'download_config',
  isActive: 'is_active',
  // Request
  userTokenId: 'user_token_id',
  profileId: 'profile_id',
  companyId: 'company_id',
  status: 'status',
  history: 'history',
  unsignedFile: 'unsigned_file',
  signedFile: 'signed_file',
  webhookUrl: 'webhook_url',
  // TransferConfig
  url: 'url',
  maxRetries: 'max_retries',
  intervalSeconds: 'interval_seconds',
  // ...adicione outros campos conforme necessário
};
