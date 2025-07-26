import { WorkerPool } from '../workerpool';

describe('WorkerPool', () => {
  it('processa tarefas em paralelo e publica eventos', async () => {
    // Mock EventBus para capturar eventos
    class MockEventBus {
      done: any[] = [];
      error: any[] = [];
      publish(eventType: string, payload: any) {
        if (eventType === 'workerpool:task:done') this.done.push(payload.result);
        if (eventType === 'workerpool:task:error') this.error.push(payload.result);
      }
    }
    const eventBus = new MockEventBus();
    const pool = new WorkerPool(eventBus as any, { numWorkers: 2 });

    pool.addTask(async () => {
      await new Promise((r) => setTimeout(r, 50));
      return 'tarefa1';
    });
    pool.addTask(async () => {
      await new Promise((r) => setTimeout(r, 30));
      return 'tarefa2';
    });
    pool.addTask(async () => {
      throw new Error('erro');
    });

    await new Promise((r) => setTimeout(r, 120));

    expect(eventBus.done).toContain('tarefa1');
    expect(eventBus.done).toContain('tarefa2');
    expect(eventBus.done.length).toBe(2);
    expect(eventBus.error[0]).toBeInstanceOf(Error);
    expect(eventBus.error[0].message).toBe('erro');
    expect(pool.getQueueLength()).toBe(0);
  });

  it('inicializa com número de workers customizado', () => {
    class DummyEventBus {
      publish() {}
    }
    const pool = new WorkerPool(new DummyEventBus() as any, { numWorkers: 5 });
    expect((pool as any).numWorkers).toBe(5);
  });

  it('usa valor padrão de numWorkers se não informado', () => {
    class DummyEventBus {
      publish() {}
    }
    const pool = new WorkerPool(new DummyEventBus() as any);
    expect((pool as any).numWorkers).toBe(4);
  });

  it('getQueueLength cobre fila cheia e vazia', async () => {
    class DummyEventBus {
      publish() {}
    }
    const pool = new WorkerPool(new DummyEventBus() as any, { numWorkers: 1 });
    expect(pool.getQueueLength()).toBe(0);
    pool.addTask(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return 'ok';
    });
    pool.addTask(async () => 'ok2');
    expect(pool.getQueueLength()).toBe(1); // uma tarefa em execução, outra na fila
    await new Promise((r) => setTimeout(r, 30));
    expect(pool.getQueueLength()).toBe(0);
  });

  it('getQueueLength retorna o tamanho correto da fila', async () => {
    class DummyEventBus {
      publish() {}
    }
    const pool = new WorkerPool(new DummyEventBus() as any, { numWorkers: 1 });
    expect(pool.getQueueLength()).toBe(0);
    pool.addTask(async () => 'a');
    expect(pool.getQueueLength()).toBe(0); // já começa a executar
    await new Promise((r) => setTimeout(r, 10));
    expect(pool.getQueueLength()).toBe(0);
  });

  it('getQueueLength retorna 0 quando fila está vazia', () => {
    class DummyEventBus {
      publish() {}
    }
    const pool = new WorkerPool(new DummyEventBus() as any);
    expect(pool.getQueueLength()).toBe(0);
  });

  it('não executa tarefa se pool estiver cheio', async () => {
    class DummyEventBus {
      publish() {}
    }
    const pool = new WorkerPool(new DummyEventBus() as any, { numWorkers: 1 });
    let started = 0;
    pool.addTask(async () => {
      started++;
      await new Promise((r) => setTimeout(r, 30));
    });
    pool.addTask(async () => {
      started++;
    });
    expect(started).toBe(1); // só uma começa imediatamente
    await new Promise((r) => setTimeout(r, 40));
    expect(started).toBe(2); // segunda só começa após a primeira terminar
  });

  it('não executa se fila estiver vazia', async () => {
    class DummyEventBus {
      publish() {}
    }
    const pool = new WorkerPool(new DummyEventBus() as any, { numWorkers: 1 });
    // Chama runNext manualmente com fila vazia
    await (pool as any).runNext();
    expect(pool.getQueueLength()).toBe(0);
  });

  it('não executa se task for undefined', async () => {
    class DummyEventBus {
      publish() {}
    }
    const pool = new WorkerPool(new DummyEventBus() as any, { numWorkers: 1 });
    (pool as any).queue.push(undefined);
    await (pool as any).runNext();
    expect(pool.getQueueLength()).toBe(0);
  });

  it('atribui eventBus corretamente no construtor', () => {
    const dummyBus = { publish() {} };
    const pool = new WorkerPool(dummyBus as any);
    expect((pool as any).eventBus).toBe(dummyBus);
  });
});
