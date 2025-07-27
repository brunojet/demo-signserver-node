import { Profile, SignerType, TransferConfig } from '../profile_model';

describe('Profile Model', () => {
  it('toSnake should convert only defined fields', () => {
    const profile = new Profile();
    profile.name = 'Test';
    profile.signer = SignerType.POSITIVO;
    profile.isActive = true;
    profile.uploadConfig = { url: 'u', maxRetries: 1, intervalSeconds: 2 };
    const snake = profile.toSnake();
    expect(snake).toEqual({
      name: 'Test',
      signer: 'positivo',
      is_active: true,
      upload_config: { url: 'u', max_retries: 1, interval_seconds: 2 }
    });
  });

  it('fromSnake should populate only mapped fields', () => {
    const snake = {
      name: 'Test',
      description: 'desc',
      signer: 'gertec',
      is_active: false,
      upload_config: { url: 'x', max_retries: 3, interval_seconds: 4 }
    };
    const profile = new Profile().fromSnake(snake);
    expect(profile.name).toBe('Test');
    expect(profile.description).toBe('desc');
    expect(profile.signer).toBe('gertec');
    expect(profile.isActive).toBe(false);
    expect(profile.uploadConfig).toEqual({ url: 'x', maxRetries: 3, intervalSeconds: 4 });
  });

  it('toSnake should not include undefined fields', () => {
    const profile = new Profile();
    const snake = profile.toSnake();
    expect(snake).toEqual({});
  });

  it('fromSnake should handle missing uploadConfig/downloadConfig', () => {
    const snake = {
      name: 'Test',
      is_active: true
    };
    const profile = new Profile().fromSnake(snake);
    expect(profile.name).toBe('Test');
    expect(profile.isActive).toBe(true);
    expect(profile.uploadConfig).toBeUndefined();
    expect(profile.downloadConfig).toBeUndefined();
  });

  it('toSnake should serialize downloadConfig if present', () => {
    const profile = new Profile();
    profile.downloadConfig = { url: 'd', maxRetries: 5, intervalSeconds: 10 };
    const snake = profile.toSnake();
    expect(snake.download_config).toEqual({ url: 'd', max_retries: 5, interval_seconds: 10 });
  });

  it('fromSnake should handle all fields including downloadConfig', () => {
    const snake = {
      name: 'Test',
      description: 'desc',
      signer: 'positivo',
      is_active: true,
      upload_config: { url: 'u', max_retries: 1, interval_seconds: 2 },
      download_config: { url: 'd', max_retries: 5, interval_seconds: 10 }
    };
    const profile = new Profile().fromSnake(snake);
    expect(profile.name).toBe('Test');
    expect(profile.downloadConfig).toEqual({ url: 'd', maxRetries: 5, intervalSeconds: 10 });
  });

  it('fromSnake should not fail with empty object', () => {
    const profile = new Profile().fromSnake({});
    expect(profile.name).toBeUndefined();
    expect(profile.uploadConfig).toBeUndefined();
    expect(profile.downloadConfig).toBeUndefined();
  });
});
