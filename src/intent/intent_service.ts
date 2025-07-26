// Serviço de intent: criação, validação de perfis, geração de URL de upload
import { v4 as uuidv4 } from 'uuid';

export interface Intent {
  id: string;
  profileId: string;
  callbackUrl?: string;
  preSignedUrl: string;
  createdAt: Date;
}

export class IntentService {
  createIntent(profileId: string, callbackUrl?: string): Intent {
    // Validação de perfil (mock)
    if (!profileId) throw new Error('profileId é obrigatório');
    // Geração de URL pré-assinada (mock)
    const preSignedUrl = `https://storage.local/upload/${uuidv4()}`;
    return {
      id: uuidv4(),
      profileId,
      callbackUrl,
      preSignedUrl,
      createdAt: new Date(),
    };
  }
}
