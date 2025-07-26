# WorkerPool

Módulo para processamento paralelo de tarefas assíncronas.

## Interface
- `WorkerPool(eventBus, options)`: inicializa o pool com EventBus e número de workers.
- `addTask(task)`: adiciona tarefa ao pool.
- Eventos publicados no EventBus:
  - `workerpool:task:done` — tarefa concluída
  - `workerpool:task:error` — erro na tarefa

## Exemplo de uso
```typescript
import { WorkerPool } from './workerpool';
import { EventBus } from '../eventbus/eventbus';

const eventBus = new EventBus();
const pool = new WorkerPool(eventBus, { numWorkers: 2 });

eventBus.subscribe('workerpool:task:done', ({ result }) => {
  console.log('Tarefa concluída:', result);
});

eventBus.subscribe('workerpool:task:error', ({ result }) => {
  console.error('Erro na tarefa:', result);
});

pool.addTask(async () => {
  // tarefa 1
  return 'ok';
});
```
