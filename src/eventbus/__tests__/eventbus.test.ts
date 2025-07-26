import { EventBus } from '../eventbus';

describe('EventBus', () => {
  it('permite subscrever e publicar eventos', async () => {
    const bus = new EventBus();
    const handler = jest.fn();
    bus.subscribe('test', handler);
    await bus.publish('test', { msg: 'hello' });
    expect(handler).toHaveBeenCalledWith({ msg: 'hello' });
  });

  it('permite remover handlers', async () => {
    const bus = new EventBus();
    const handler = jest.fn();
    bus.subscribe('test', handler);
    bus.unsubscribe('test', handler);
    await bus.publish('test', { msg: 'bye' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('limpa todos os handlers', async () => {
    const bus = new EventBus();
    const handler = jest.fn();
    bus.subscribe('test', handler);
    bus.clear();
    await bus.publish('test', { msg: 'clear' });
    expect(handler).not.toHaveBeenCalled();
  });
});
