// EventBus genérico para publicação e assinatura de eventos
export type EventHandler<T = any> = (event: T) => void | Promise<void>;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe<T = any>(eventType: string, handler: EventHandler<T>) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish<T = any>(eventType: string, event: T): Promise<void> {
    const handlers = this.handlers.get(eventType) || [];
    for (const handler of handlers) {
      await handler(event);
    }
  }

  unsubscribe<T = any>(eventType: string, handler: EventHandler<T>) {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      this.handlers.set(eventType, handlers.filter(h => h !== handler));
    }
  }

  clear() {
    this.handlers.clear();
  }
}
