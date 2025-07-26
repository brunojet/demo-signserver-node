// WorkerPool genérico para processamento paralelo de tarefas
import { EventBus } from '../eventbus/eventbus';
import { logger } from '../observability/observability';

export type Task<T = any> = () => Promise<T>;
export type TaskResult<T = any> = { task: Task<T>; result: T | Error };
export type WorkerPoolOptions = { numWorkers?: number };

export class WorkerPool {
  private queue: Task[] = [];
  private running: number = 0;
  private numWorkers: number;
  private eventBus: EventBus;

  constructor(eventBus: EventBus, options: WorkerPoolOptions = {}) {
    this.numWorkers = options.numWorkers || 4;
    this.eventBus = eventBus;
  }

  addTask<T>(task: Task<T>) {
    this.queue.push(task);
    logger.debug('WorkerPool: tarefa adicionada', { queueLength: this.queue.length });
    this.runNext();
  }

  private async runNext() {
    if (this.running >= this.numWorkers || this.queue.length === 0) return;
    const task = this.queue.shift();
    if (!task) return;
    this.running++;
    logger.debug('WorkerPool: executando tarefa', {
      running: this.running,
      queueLength: this.queue.length,
    });
    try {
      const result = await task();
      logger.info('WorkerPool: tarefa concluída', { result });
      this.eventBus.publish('workerpool:task:done', { task, result });
    } catch (error) {
      logger.error('WorkerPool: erro na tarefa', { error });
      this.eventBus.publish('workerpool:task:error', { task, result: error });
    } finally {
      this.running--;
      this.runNext();
    }
  }

  getQueueLength() {
    return this.queue.length;
  }
}
