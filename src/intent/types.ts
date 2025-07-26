// Tipos para intent
export interface Intent {
  id: string;
  profileId: string;
  callbackUrl?: string;
  preSignedUrl: string;
  createdAt: Date;
}
