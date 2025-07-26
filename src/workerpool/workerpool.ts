// WorkerPool genérico para processamento paralelo de tarefas
import { EventBus } from '../eventbus/eventbus';

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
    this.runNext();
  }

  private async runNext() {
    if (this.running >= this.numWorkers || this.queue.length === 0) return;
    const task = this.queue.shift();
    if (!task) return;
    this.running++;
    try {
      const result = await task();
      this.eventBus.publish('workerpool:task:done', { task, result });
    } catch (error) {
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
