import { EventBus } from '../eventbus';

describe('EventBus + WorkerPool', () => {
  it('executa handlers concorrentes via WorkerPool ao publicar evento', async () => {
    const bus = new EventBus();
    const results: any[] = [];
    bus.register(
      'test',
      'okHandler',
      async (event) => {
        await new Promise((r) => setTimeout(r, 20));
        results.push(event + '-ok');
      },
      2
    );
    bus.register(
      'test',
      'failHandler',
      async (event) => {
        throw new Error('fail');
      },
      2
    );
    await bus.publish('test', 'evt1');
    await new Promise((r) => setTimeout(r, 50));
    expect(results).toContain('evt1-ok');
  });

  it('remove handler registrado com unregister', async () => {
    const bus = new EventBus();
    const results: any[] = [];
    bus.register(
      'test',
      'okHandler',
      async (event) => {
        results.push(event);
      },
      1
    );
    bus.unregister('test', 'okHandler');
    await bus.publish('test', 'evt2');
    await new Promise((r) => setTimeout(r, 20));
    expect(results).not.toContain('evt2');
  });

  it('adiciona múltiplos handlers para o mesmo eventType', () => {
    const bus = new EventBus();
    bus.register('multi', 'handler1', async () => {});
    bus.register('multi', 'handler2', async () => {});
    expect((bus as any).handlers.get('multi').length).toBe(2);
  });

  it('limpa todos os handlers com clear', async () => {
    const bus = new EventBus();
    const results: any[] = [];
    bus.register(
      'test',
      'okHandler',
      async (event) => {
        results.push(event);
      },
      1
    );
    bus.clear();
    await bus.publish('test', 'evt3');
    await new Promise((r) => setTimeout(r, 20));
    expect(results).not.toContain('evt3');
  });

  it('register adiciona handler para eventType já existente', async () => {
    const bus = new EventBus();
    const results: any[] = [];
    bus.register(
      'test',
      'handler1',
      async (event) => {
        results.push('h1');
      },
      1
    );
    bus.register(
      'test',
      'handler2',
      async (event) => {
        results.push('h2');
      },
      1
    );
    await bus.publish('test', 'evt');
    await new Promise((r) => setTimeout(r, 20));
    expect(results).toContain('h1');
    expect(results).toContain('h2');
  });

  it('unregister não faz nada se eventType não existe', () => {
    const bus = new EventBus();
    // Não deve lançar erro
    expect(() => bus.unregister('inexistente', 'handler')).not.toThrow();
  });

  it('register cria novo eventType se não existe', async () => {
    const bus = new EventBus();
    expect(bus['handlers'].has('novo')).toBe(false);
    bus.register('novo', 'handler', async () => {}, 1);
    expect(bus['handlers'].has('novo')).toBe(true);
  });
});
