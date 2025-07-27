# Repository Design - Node.js SignServer

## Contexto da Decisão

Durante o desenvolvimento do SignServer em Node.js, precisamos definir a arquitetura do repository pattern que abstrai o acesso ao DynamoDB. Este documento registra as decisões arquiteturais tomadas.

## Problema

O projeto Go criou uma abstração complexa para DynamoDB com:

- Conversões automáticas de PK/SK
- Chaves compostas
- Validações elaboradas
- Múltiplas camadas de abstração

Para um MVP/demo, essa complexidade era excessiva e dificultava manutenção.

## Decisão: Interface "Relacional" sobre DynamoDB

### Princípio Central

**Abstrair completamente as características do DynamoDB**, oferecendo uma interface familiar para desenvolvedores vindos de bancos relacionais.

### Padrão Assíncrono vs Síncrono

#### Repository = Assíncrono (mas bloqueia na REST)

```typescript
// Repository usa Promise por limitação técnica
interface Repository<T> {
  findById(ctx: Context, id: string): Promise<T | null>;
  create(ctx: Context, entity: T): Promise<T>;
}

// Na REST API = bloqueia até ter resposta
app.get("/profiles/:id", async (req, res) => {
  const profile = await repo.findById(ctx, req.params.id); // Espera terminar
  res.json(profile); // Só responde quando tem resultado
});
```

**Justificativa:**

- DynamoDB é uma chamada de rede (sempre alguns ms)
- Node.js é single-thread - operações síncronas travariam toda aplicação
- Para 100 usuários simultâneos: async = ~50ms, sync = 5000ms

#### EventBus = Verdadeiramente Assíncrono

```typescript
// EventBus = fire-and-forget
app.post("/documents/sign", async (req, res) => {
  eventBus.publish("sign_document", req.body); // Não espera
  res.json({ message: "Processamento iniciado" }); // Resposta imediata
});
```

## Interface do Repository

### API "Relacional"

```typescript
interface Repository<T> {
  // CRUD básico - como ORM tradicional
  create(ctx: Context, entity: T): Promise<T>;
  findById(ctx: Context, id: string): Promise<T | null>;
  update(ctx: Context, id: string, updates: Partial<T>): Promise<T>;
  delete(ctx: Context, id: string): Promise<void>;

  // Queries "relacionais"
  findByField(ctx: Context, field: string, value: any): Promise<T[]>;
  findWhere(ctx: Context, conditions: Record<string, any>): Promise<T[]>;

  // Paginação adaptada ao DynamoDB (realista)
  list(
    ctx: Context,
    options?: {
      size?: number; // Tamanho da página
      pageToken?: string; // Token da página (base64 do LastEvaluatedKey)
      orderBy?: string;
      orderDirection?: "ASC" | "DESC";
    }
  ): Promise<{
    content: T[]; // Itens da página atual
    size: number; // Tamanho da página
    nextPageToken?: string; // Token para próxima página
    hasNext: boolean; // Tem próxima página
  }>;

  // Método auxiliar para primeira página
  listFirstPage(
    ctx: Context,
    options?: {
      size?: number;
      orderBy?: string;
      orderDirection?: "ASC" | "DESC";
    }
  ): Promise<{
    content: T[];
    size: number;
    nextPageToken?: string;
    hasNext: boolean;
  }>;
}
```

### Uso Transparente

```typescript
// Desenvolvedor não pensa em PK/SK
const profile = await profileRepo.findById(ctx, "123");
const profiles = await profileRepo.findByField(ctx, "fabricante", "POSITIVO");
const requests = await requestRepo.findWhere(ctx, {
  empresa: "EMPRESA123",
  status: "PENDING",
});

// Paginação realista com DynamoDB
const page1 = await profileRepo.listFirstPage(ctx, {
  size: 20,
  orderBy: "created_at",
  orderDirection: "DESC",
});

const page2 = await profileRepo.list(ctx, {
  size: 20,
  pageToken: page1.nextPageToken, // String token, não número
});
```

### Abstração Interna

Por baixo dos panos, o repository:

1. Converte queries "relacionais" para PK/SK do DynamoDB
2. Usa GSI quando necessário
3. Faz paginação com tokens do DynamoDB
4. Abstrai toda complexidade do NoSQL

## Modelagem DynamoDB Simplificada

### Estratégia Final

Após análise de hot partitions, custos e complexidade, optamos por:

#### Tabela Única com PK/SK Simples

```
Profiles:
PK: PROFILE#POSITIVO    SK: PROFILE#abc123
PK: PROFILE#CERTISIGN   SK: PROFILE#def456

Requests:
PK: REQUEST#EMPRESA123  SK: REQUEST#req789
PK: REQUEST#EMPRESA456  SK: REQUEST#req012
```

#### Vantagens

- **Simplicidade**: Fácil de entender e implementar
- **Performance**: Queries diretas sem hot partitions
- **Custo**: Sem GSI desnecessários
- **Escalabilidade**: Distribui naturalmente por fabricante/empresa

#### Queries Suportadas

1. **Por ID**: `PK = PROFILE#POSITIVO AND SK = PROFILE#abc123`
2. **Por Fabricante**: `PK = PROFILE#POSITIVO` (todos profiles Positivo, paginado)
3. **Por Empresa**: `PK = REQUEST#EMPRESA123` (todas requests da empresa, paginado)
4. **Listagem Global**: Scan com filtros e paginação (aceitável para MVP)

### Alternativas Descartadas

#### Single Table Design Complexo

```
❌ PK: PROFILE    SK: POSITIVO#abc123
❌ PK: REQUEST    SK: EMPRESA123#req789
```

**Problema**: Hot partition em PROFILE e REQUEST

#### GSI para Queries Secundárias

```
❌ GSI1: fabricante -> profiles
❌ GSI2: empresa -> requests
```

**Problema**: Custo desnecessário para MVP, duplicação de storage

### Paginação no DynamoDB

O DynamoDB oferece paginação nativa através de **LastEvaluatedKey**:

#### Query (PK específica - mais eficiente)

```typescript
// REQUEST#EMPRESA123 - páginas de 10 itens
const page1 = await dynamodb.query({
  KeyConditionExpression: "PK = :pk",
  ExpressionAttributeValues: { ":pk": "REQUEST#EMPRESA123" },
  Limit: 10,
});

const page2 = await dynamodb.query({
  KeyConditionExpression: "PK = :pk",
  ExpressionAttributeValues: { ":pk": "REQUEST#EMPRESA123" },
  Limit: 10,
  ExclusiveStartKey: page1.LastEvaluatedKey, // Começa onde parou
});
```

#### Scan (toda tabela - menos eficiente mas funcional)

```typescript
// Busca global com filtros paginada
const page1 = await dynamodb.scan({
  FilterExpression: "attribute_exists(empresa)",
  Limit: 20,
});

const page2 = await dynamodb.scan({
  FilterExpression: "attribute_exists(empresa)",
  Limit: 20,
  ExclusiveStartKey: page1.LastEvaluatedKey,
});
```

#### Abstração na Interface

```typescript
// API REST com tokens (honesta sobre limitações)
GET /requests?size=10                           // Primeira página
GET /requests?size=10&pageToken=eyJQSyI6...     // Próximas páginas

const page1 = await requestRepo.listFirstPage(ctx, { size: 10 })
// Retorna: { content: [...], size: 10, nextPageToken: "eyJQSyI6...", hasNext: true }

const page2 = await requestRepo.list(ctx, {
  size: 10,
  pageToken: page1.nextPageToken
})
// Retorna: { content: [...], size: 10, nextPageToken: "eyJTSyI6...", hasNext: true }

// ❌ NÃO É POSSÍVEL no DynamoDB:
// GET /requests?page=5&size=10  // Não consegue "pular" para página 5
```

#### Por que pageToken em vez de page number?

```typescript
// DynamoDB funciona assim:
LastEvaluatedKey: {
  PK: { S: "REQUEST#EMPRESA123" },
  SK: { S: "REQUEST#req789" }
}

// Não tem como "calcular" onde está a página 5
// Você PRECISA do token da página 4 para chegar na 5
// É limitação fundamental do DynamoDB, não do nosso código
```

#### Como Resolver Offset/Limit com DynamoDB

```typescript
class Repository<T> {
  // Implementação cursor (eficiente)
  async list(options: { limit?: number; cursor?: string }) {
    const startKey = options.cursor
      ? JSON.parse(Buffer.from(options.cursor, "base64").toString())
      : undefined;

    const result = await dynamodb.query({
      Limit: options.limit || 20,
      ExclusiveStartKey: startKey,
    });

    return {
      items: result.Items,
      nextCursor: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString(
            "base64"
          )
        : undefined,
      hasMore: !!result.LastEvaluatedKey,
    };
  }

  // Implementação offset (custosa - só para compatibilidade)
  async listWithOffset(options: { limit?: number; offset?: number }) {
    let items = [];
    let lastKey = undefined;
    let processedCount = 0;
    const targetOffset = options.offset || 0;
    const targetLimit = options.limit || 20;

    // Itera até chegar no offset desejado
    while (processedCount < targetOffset + targetLimit) {
      const result = await dynamodb.query({
        Limit: Math.min(100, targetOffset + targetLimit - processedCount),
        ExclusiveStartKey: lastKey,
      });

      if (processedCount >= targetOffset) {
        items.push(...result.Items);
      }

      processedCount += result.Items.length;
      lastKey = result.LastEvaluatedKey;

      if (!lastKey) break;
    }

    return {
      items: items.slice(0, targetLimit),
      hasMore: !!lastKey,
      total: -1, // Impossível calcular eficientemente
    };
  }
}
```

## Implementação

### Repository Base

```typescript
abstract class BaseRepository<T> {
  constructor(protected tableName: string, protected pkPrefix: string) {}

  protected abstract toDynamoItem(entity: T): Record<string, any>;
  protected abstract fromDynamoItem(item: Record<string, any>): T;

  // Implementa interface padrão usando DynamoDB por baixo
}

// Implementações específicas
class ProfileRepository extends BaseRepository<Profile> {
  constructor() {
    super("profiles_table", "PROFILE");
  }

  // Converte findByField("fabricante", "POSITIVO")
  // para PK = "PROFILE#POSITIVO"
}
```

### Configuração

```typescript
// Recebe tabela, contexto e tipo como parâmetros
const profileRepo = new Repository<Profile>({
  tableName: "main_table",
  context: "profile",
  entityType: Profile,
});

const requestRepo = new Repository<Request>({
  tableName: "main_table",
  context: "request",
  entityType: Request,
});
```

## Benefícios da Abordagem

1. **Simplicidade**: Interface familiar, sem curva de aprendizado DynamoDB
2. **Manutenibilidade**: Código limpo, fácil de debugar
3. **Flexibilidade**: Pode trocar DynamoDB por outro banco facilmente
4. **Performance**: Abstração não impacta velocidade
5. **Escalabilidade**: Preparado para crescimento sem over-engineering

## Conclusão

Optamos por **simplicidade sobre complexidade**, criando uma abstração que:

- Esconde a complexidade do DynamoDB
- Oferece interface familiar e intuitiva
- Mantém performance e escalabilidade
- Facilita manutenção e evolução

Para um MVP/demo, essa abordagem oferece o melhor custo-benefício entre funcionalidade e simplicidade.

## Modelagem de Dados - Adaptada do Projeto Go

### Análise da Modelagem Atual (Go)

O projeto Go possui entidades complexas com muitas funcionalidades. Vamos simplificar mantendo o essencial:

**Estrutura Go atual:**

- `Profile` - Perfis de dispositivos com configs complexas
- `Request` - Requests com histórico completo e webhooks
- `BaseDomain` - Timestamps e IDs

### Entidades Simplificadas (Node.js)

#### Profile (Adaptado)

```typescript
interface Profile {
  // Campos base (do BaseDomain Go)
  id: string; // UUID v4 (era ID no Go)
  createdAt: Date; // era CreatedAt string
  updatedAt: Date; // era UpdatedAt string
  name : string; // Nome do perfil (era ProfileId no Go)
  description: string; // era Description pointer
  signer: SignerType; // era Signer enum
  signerParams?: Record<string, any>; // Parâmetros customizados enviados ao assinador destino
  uploadConfig: {
    url: string;
    maxRetries: number;
    intervalSeconds: number;
  };
  downloadConfig: {
    url: string;
    maxRetries: number;
    intervalSeconds: number;
  };

  // Status
  isActive: boolean; // Novo - controle de ativo/inativo
}

enum SignerType {
  POSITIVO = "positivo", // era SignerPositivo
  GERTEC = "gertec", // era SignerGertec
}
```

#### Request (Adaptado)

```typescript
interface Request {
  // Campos base (do BaseDomain Go)
  id: string; // UUID v4
  createdAt: Date;
  updatedAt: Date;

  // Relacionamento (do Go)
  ProfileId: string; // era ProfileId pointer

  // Status (simplificado do Go)
  status: RequestStatus; // era SignerStatus

  // Arquivos (adaptado do storage.FileInfo Go)
  unsignedFile: {
    originalName: string; // Nome original
    s3Key: string; // Chave no S3
    size: number; // Tamanho em bytes
    contentType: string; // MIME type
  };
  signedFile?: {
    s3Key: string;
    size: number;
    contentType: string;
    signedAt: Date;
  };

  // Webhook (do Go)
  webhookUrl?: string; // era WebhookURL pointer

  // Histórico simplificado (era RequestHistoryEntry complexo)
  history: {
    timestamp: Date; // era CreatedAt string
    status: RequestStatus; // era SignerStatus pointer
    error?: {
      location: string; // era SignerError.Location
      message: string; // era SignerError.Message
    };
  }[];

  // Novos campos para facilitar queries
  company: string; // Para agrupar por empresa
  requestedBy: string; // ID do usuário solicitante
  processedBy?: string; // ID do usuário que processou
}

enum RequestStatus {
  CREATED = "created", // era SignerStatusCreated
  UPLOADED = "uploaded", // era SignerStatusUploaded
  SIGNING = "signing", // era SignerStatusSigning
  SIGNED = "signed", // era SignerStatusSigned
  SIGNED_AVAILABLE = "signed_available", // era SignerStatusSignedAvailable
  DOWNLOAD_REQUESTED = "download_requested", // era SignerStatusDownloadRequested
  SIGNING_FAILED = "signing_failed", // era SignerStatusSigningFailed
}
```

### Mapeamento DynamoDB Otimizado

#### Opção Recomendada: PK = UUID Simples

```typescript
// Profile no DynamoDB
{
  PK: "550e8400-e29b-41d4-a716-446655440000", // ID do profile
  SK: "PROFILE",                               // Tipo fixo
  entity_type: "PROFILE",                      // Para filtros

  // Campos do Go adaptados
  signer: "positivo",                          // era Signer
  profileId: "profile_001",                    // era ProfileId
  description: "Perfil Positivo Produção",    // era Description

  // Novos campos simplificados
  certificatePath: "s3://certs/positivo.p12",
  privateKeyPath: "s3://keys/positivo.key",
  password: "encrypted_hash",
  isActive: true,

  // Upload/Download simplificado
  uploadConfig: {
    url: "https://api.signer.com/upload",
    maxRetries: 3,
    timeoutSeconds: 30
  },
  downloadConfig: {
    url: "https://api.signer.com/download",
    maxRetries: 3,
    timeoutSeconds: 60
  },

  // Timestamps (formato ISO)
  createdAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-01-15T10:30:00.000Z"
}

// Request no DynamoDB
{
  PK: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", // ID da request
  SK: "REQUEST",                               // Tipo fixo
  entity_type: "REQUEST",                      // Para filtros

  // Relacionamento
  ProfileId: "550e8400-e29b-41d4-a716-446655440000",

  // Status
  status: "signed",                            // era SignerStatus

  // Arquivos
  unsignedFile: {
    originalName: "contrato.pdf",
    s3Key: "uploads/6ba7b810/contrato.pdf",
    size: 1024000,
    contentType: "application/pdf"
  },
  signedFile: {
    s3Key: "signed/6ba7b810/contrato_signed.pdf",
    size: 1124000,
    contentType: "application/pdf",
    signedAt: "2024-01-20T14:35:00.000Z"
  },

  // Webhook
  webhookUrl: "https://empresa.com/webhook/signature",

  // Histórico (array simplificado)
  history: [
    {
      timestamp: "2024-01-20T14:30:00.000Z",
      status: "created",
      error: null
    },
    {
      timestamp: "2024-01-20T14:31:00.000Z",
      status: "uploaded",
      error: null
    },
    {
      timestamp: "2024-01-20T14:35:00.000Z",
      status: "signed",
      error: null
    }
  ],

  // Campos para facilitar queries
  company: "EMPRESA123",                       // Novo
  requestedBy: "user_456",                     // Novo
  processedBy: "user_789",                     // Novo

  // Timestamps
  createdAt: "2024-01-20T14:30:00.000Z",
  updatedAt: "2024-01-20T14:35:00.000Z"
}
```

### Queries Principais Adaptadas

#### Buscar Profile por ID (GetItem - O(1))

```typescript
const profile = await dynamodb.getItem({
  Key: {
    PK: { S: "550e8400-e29b-41d4-a716-446655440000" },
    SK: { S: "PROFILE" },
  },
});
```

#### Listar Profiles por Signer (Scan com filtro)

```typescript
const profiles = await dynamodb.scan({
  FilterExpression:
    "entity_type = :type AND signer = :signer AND isActive = :active",
  ExpressionAttributeValues: {
    ":type": { S: "PROFILE" },
    ":signer": { S: "positivo" },
    ":active": { BOOL: true },
  },
});
```

#### Buscar Request por ID (GetItem - O(1))

```typescript
const request = await dynamodb.getItem({
  Key: {
    PK: { S: "6ba7b810-9dad-11d1-80b4-00c04fd430c8" },
    SK: { S: "REQUEST" },
  },
});
```

#### Listar Requests por Empresa (Scan com filtro)

```typescript
const requests = await dynamodb.scan({
  FilterExpression: "entity_type = :type AND company = :company",
  ExpressionAttributeValues: {
    ":type": { S: "REQUEST" },
    ":company": { S: "EMPRESA123" },
  },
});
```

#### Listar Requests por Status (Scan com filtro)

```typescript
const pendingRequests = await dynamodb.scan({
  FilterExpression: "entity_type = :type AND #status = :status",
  ExpressionAttributeNames: {
    "#status": "status", // 'status' é palavra reservada
  },
  ExpressionAttributeValues: {
    ":type": { S: "REQUEST" },
    ":status": { S: "signing" },
  },
});
```

### Melhorias da Adaptação

✅ **Simplificação**: Removeu complexidade desnecessária do Go  
✅ **Campos novos**: `company`, `requestedBy`, `isActive` para facilitar queries  
✅ **PK UUID**: Elimina hot partitions e limitações de LSI  
✅ **Timestamps ISO**: Formato padrão JavaScript/TypeScript  
✅ **Estruturas planas**: Evita nested objects complexos  
✅ **Scan otimizado**: Filtros eficientes para MVP

### Migração do Go para Node.js

Para migrar dados existentes:

1. **PK**: Usar o campo `ID` do Go como PK UUID
2. **SK**: Fixo baseado no tipo de entidade
3. **Campos**: Mapear 1:1 mantendo nomes similares
4. **Timestamps**: Converter string RFC3339 para Date
5. **Enums**: Manter valores string compatíveis
