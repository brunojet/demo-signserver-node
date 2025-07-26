import { IntentService } from '../intent_service';

describe('IntentService', () => {
  it('cria intent válida', () => {
    const service = new IntentService();
    const intent = service.createIntent('profile-123', 'http://callback');
    expect(intent.profileId).toBe('profile-123');
    expect(intent.preSignedUrl).toContain('https://storage.local/upload/');
  });

  it('falha sem profileId', () => {
    const service = new IntentService();
    expect(() => service.createIntent('')).toThrow('profileId é obrigatório');
  });
});
