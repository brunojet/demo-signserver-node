import { WorkerPool } from '../workerpool/workerpool';
import { logger } from '../observability/observability';

export type EventHandler<T = any> = (event: T) => void | Promise<void>;
export type RegisteredHandler = {
  handlerName: string;
  pool: WorkerPool;
  handler: EventHandler;
};

export class EventBus {
  private handlers: Map<string, RegisteredHandler[]> = new Map();

  /**
   * Registra handler concorrente para evento
   */
  register<T = any>(
    eventType: string,
    handlerName: string,
    handler: EventHandler<T>,
    numWorkers = 4
  ) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    const pool = new WorkerPool(this, { numWorkers });
    this.handlers.get(eventType)!.push({ handlerName, pool, handler });
    logger.info('EventBus: handler registrado', { eventType, handlerName, numWorkers });
  }

  /**
   * Publica evento disparando handlers via WorkerPool
   */
  async publish<T = any>(eventType: string, event: T): Promise<void> {
    const registered = this.handlers.get(eventType) || [];
    logger.info('EventBus: evento publicado', { eventType, event });
    for (const { pool, handler } of registered) {
      pool.addTask(() => Promise.resolve(handler(event)));
    }
  }

  /**
   * Remove handler registrado
   */
  unregister(eventType: string, handlerName: string) {
    const arr = this.handlers.get(eventType);
    if (arr) {
      this.handlers.set(
        eventType,
        arr.filter((h) => h.handlerName !== handlerName)
      );
      logger.info('EventBus: handler removido', { eventType, handlerName });
    }
  }

  clear() {
    this.handlers.clear();
  }
}
