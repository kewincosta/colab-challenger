# Serviço de Triagem Municipal

> Plataforma inteligente para recebimento e classificação automática de relatos de problemas urbanos, utilizando IA generativa (Google Gemini) com processamento assíncrono via fila.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Iniciando o Projeto](#iniciando-o-projeto)
- [Resumo do Fluxo](#resumo-do-fluxo)
- [Diagrama de Sequência](#diagrama-de-sequência)
- [Arquitetura do Backend](#arquitetura-do-backend)
  - [Clean Architecture e DDD](#clean-architecture-e-ddd)
  - [Estratégia de IDs: Inteiro Interno + UUID Externo](#estratégia-de-ids-inteiro-interno--uuid-externo)
  - [Processamento Assíncrono com Fila](#processamento-assíncrono-com-fila)
  - [Integração com IA (Google Gemini)](#integração-com-ia-google-gemini)
  - [Cache de Classificação](#cache-de-classificação)
  - [Testes Automatizados](#testes-automatizados)
- [Arquitetura do Frontend](#arquitetura-do-frontend)
  - [Stack Técnico](#stack-técnico)
  - [Organização por Features](#organização-por-features)
  - [Formulários e Validação](#formulários-e-validação)
  - [Sistema de Design](#sistema-de-design)
  - [Internacionalização (i18n)](#internacionalização-i18n)
  - [Tematização (Dark/Light)](#tematização-darklight)
  - [Roteamento e Navegação](#roteamento-e-navegação)
  - [Testes E2E (Playwright)](#testes-e2e-playwright)
- [API — Endpoints](#api--endpoints)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Convenção de Idioma](#convenção-de-idioma)
- [Documentação Complementar](#documentação-complementar)

---

## Visão Geral

O **Serviço de Triagem Municipal** é um sistema para gestão de relatos urbanos. Cidadãos submetem relatos (buracos, iluminação, saneamento, etc.) por meio de um formulário web. O backend recebe, valida e persiste o relato, enfileirando-o automaticamente para classificação por IA. Um worker assíncrono processa a fila, envia o relato ao Google Gemini (com prompt estruturado, anti-alucinação e JSON schema forçado), e armazena o resultado (categoria, prioridade e resumo técnico). Todo o pipeline opera com retentativas exponenciais, cache por hash SHA-256 e idempotência, garantindo resiliência sem intervenção manual.

---

## Pré-requisitos

| Dependência | Versão mínima | Propósito |
|---|---|---|
| **Node.js** | 20.x | Runtime do backend e frontend |
| **npm** | 9.x | Gerenciador de pacotes (workspaces) |
| **Docker** + **Docker Compose** | 24.x / 2.x | PostgreSQL, Redis e build de produção |
| **Chave de API do Google Gemini** | — | Classificação por IA generativa |

### Obtendo a API Key do Gemini

1. Acesse [Google AI Studio](https://aistudio.google.com/apikey).
2. Crie ou selecione um projeto Google Cloud.
3. Gere uma API Key e copie-a para a variável `GEMINI_API_KEY` no arquivo `.env`.

> **Atenção**: a API Key é **obrigatória**. Sem ela, o serviço de classificação falhará no startup (validação fail-fast via Zod).

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` na raiz do projeto e preencha os valores:

```bash
cp .env.example .env
```

### Backend (API)

| Variável | Obrigatória | Default | Descrição |
|---|---|---|---|
| `NODE_ENV` | Não | `development` | Ambiente de execução (`development`, `production`) |
| `PORT` | Não | `3000` | Porta do servidor HTTP |
| `DB_HOST` | **Sim**¹ | `localhost` | Host do PostgreSQL |
| `DB_PORT` | **Sim**¹ | `5432` | Porta do PostgreSQL |
| `DB_USER` | **Sim**¹ | `postgres` | Usuário do banco |
| `DB_PASSWORD` | **Sim**¹ | `postgres` | Senha do banco |
| `DB_NAME` | **Sim**¹ | `urban_triage` | Nome do banco de dados |
| `REDIS_HOST` | **Sim**¹ | `localhost` | Host do Redis |
| `REDIS_PORT` | **Sim**¹ | `6379` | Porta do Redis |
| `GEMINI_API_KEY` | **Sim** | — | Chave de API do Google Gemini |
| `GEMINI_MODEL` | Não | `gemini-3-flash-preview` | Modelo Gemini a utilizar |
| `GEMINI_TIMEOUT_MS` | Não | `30000` | Timeout por requisição à IA (ms) |

> ¹ Possuem defaults que funcionam **apenas** para desenvolvimento local com o Docker Compose fornecido. Em qualquer outro ambiente (produção, staging, Docker Compose customizado), **devem ser configuradas explicitamente**. Sem PostgreSQL e Redis acessíveis com as credenciais corretas, a API não inicia e o processamento de fila não funciona.

### Frontend (Web)

| Variável | Obrigatória | Default | Descrição |
|---|---|---|---|
| `VITE_API_URL` | Não | `http://localhost:3000/api` | URL base da API consumida pelo frontend |

> Todas as variáveis do backend são validadas no startup via schema Zod (`env.validation.ts`). Se alguma obrigatória estiver ausente ou inválida, a API imprime uma tabela de erros e encerra imediatamente.

---

## Iniciando o Projeto

### Modo Desenvolvimento (recomendado)

O script `dev.sh` executa o fluxo completo: pre-flight checks, instalação de dependências, containers Docker, backend com hot-reload e frontend:

```bash
# Na raiz do monorepo
npm run dev
```

Isso equivale a:

```bash
sh scripts/dev.sh
```

O script faz:
1. Verifica Node.js, npm e Docker instalados.
2. Copia `.env.example` → `.env` caso não exista.
3. Executa `npm install`.
4. Sobe `postgres` e `redis` via Docker Compose.
5. Aguarda PostgreSQL ficar disponível.
6. Inicia o backend com `ts-node-dev` (hot-reload).
7. Aguarda o health check do backend.
8. Inicia o frontend com `vite`.

### Modo Manual

```bash
# 1. Instalar dependências
npm install

# 2. Subir PostgreSQL e Redis
docker compose up -d postgres redis

# 3. Iniciar o backend (hot-reload)
npm run api:dev

# 4. Iniciar o frontend (em outro terminal)
npm run web:dev
```

### Docker Compose (todos os serviços)

```bash
docker compose up --build
```

Isso sobe PostgreSQL, Redis e a API em containers (build multi-stage).

### Acessos

| Serviço | URL |
|---|---|
| API | `http://localhost:3000/api` |
| Swagger UI | `http://localhost:3000/api/docs` |
| Frontend | `http://localhost:5173` |

---

## Resumo do Fluxo

O cidadão preenche um formulário no frontend informando título, descrição e endereço estruturado (com busca automática de CEP via ViaCEP). Ao submeter, o frontend envia um `POST /api/reports` para o backend. O backend valida o payload com `Zod schema`, cria a entidade `Report` com seus Value Objects (título, descrição, localização), persiste no PostgreSQL via TypeORM e enfileira um job de classificação no BullMQ/Redis. O report é retornado ao client com `classificationStatus: PENDING`. Em background, um worker consome o job, envia o relato ao Google Gemini com um prompt estruturado (taxonomia de 9 categorias, regras de prioridade, anti-alucinação, segurança contra prompt injection), recebe um JSON validado por Zod schema, e persiste o resultado como `ClassificationResult`. Se a IA retornar JSON inválido, o sistema tenta um **repair prompt** uma vez antes de falhar. Falhas são reprocessadas com backoff exponencial (3 tentativas, delay de 3s × 2^n). Resultados idênticos são cacheados em Redis por 24h usando hash SHA-256 do conteúdo do relato.

> **Por que Zod (e não class-validator)?** O projeto utiliza Zod como biblioteca **única** de validação em todas as camadas — DTOs HTTP, resposta da IA, variáveis de ambiente e frontend (React + TanStack Form via Standard Schema). Isso garante single source of truth entre tipo TypeScript e regra de validação (`z.infer<typeof schema>`), elimina dependências extras (`class-validator`, `class-transformer`, `reflect-metadata` para decorators), e permite composição de schemas entre front e back no monorepo.

---

## Diagrama de Sequência

### Cenário Feliz (Happy Path)

```mermaid
sequenceDiagram
    actor Cidadão
    participant Web as Frontend React
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Queue as BullMQ / Redis
    participant Worker as Classification Worker
    participant Cache as Redis Cache
    participant AI as Google Gemini

    Cidadão->>Web: Preenche formulário de relato
    Web->>Web: Busca CEP via ViaCEP (auto-fill)
    Web->>API: POST /api/reports
    API->>API: Valida payload (Zod schema)
    API->>DB: Persiste Report (status: PENDING)
    API->>Queue: Enfileira job classify-report
    API-->>Web: 201 Created (classificationStatus: PENDING)
    Web-->>Cidadão: Exibe página de confirmação

    Queue->>Worker: Consome job
    Worker->>DB: Busca Report por ID
    Worker->>DB: Atualiza status → PROCESSING
    Worker->>Cache: Verifica cache (SHA-256 hash)
    Cache-->>Worker: Cache miss
    Worker->>AI: Envia prompt (system + user message)
    AI-->>Worker: JSON { category, priority, technical_summary }
    Worker->>Worker: Valida resposta com Zod schema
    Worker->>Cache: Armazena resultado (TTL 24h)
    Worker->>DB: Persiste ClassificationResult
    Worker->>DB: Atualiza Report status → DONE
```

### Cenário de Erro (Retry com Repair Prompt)

```mermaid
sequenceDiagram
    participant Queue as BullMQ / Redis
    participant Worker as Classification Worker
    participant Cache as Redis Cache
    participant AI as Google Gemini
    participant DB as PostgreSQL

    Queue->>Worker: Consome job (tentativa 1)
    Worker->>DB: Busca Report, status → PROCESSING
    Worker->>Cache: Cache miss
    Worker->>AI: Envia prompt
    AI-->>Worker: JSON inválido / campo ausente
    Worker->>Worker: Validação Zod falha
    Worker->>AI: Envia repair prompt (com erro + resposta original)
    AI-->>Worker: JSON ainda inválido
    Worker->>Worker: Marca Report como FAILED (attempts: 1)
    Worker-->>Queue: Lança exceção → BullMQ agenda retry

    Note over Queue: Backoff exponencial: 3s × 2^attempt

    Queue->>Worker: Consome job (tentativa 2)
    Worker->>DB: Busca Report, status → PROCESSING
    Worker->>Cache: Cache miss
    Worker->>AI: Envia prompt
    AI-->>Worker: JSON válido ✓
    Worker->>Worker: Validação Zod passa
    Worker->>Cache: Armazena resultado (TTL 24h)
    Worker->>DB: Persiste ClassificationResult
    Worker->>DB: Atualiza Report status → DONE
```

---

## Arquitetura do Backend

### Clean Architecture e DDD

O backend segue **Clean Architecture** combinada com **Domain-Driven Design**, com a seguinte separação de camadas:

```
src/
├── domain/          → Entidades, Value Objects, exceções e interfaces de repositório
├── application/     → Use Cases, Ports (interfaces) e lógica de negócio de IA
├── infrastructure/  → Implementações concretas (TypeORM, Redis, Gemini client, BullMQ)
├── presentation/    → Controllers HTTP, DTOs com validação, filtros de exceção
└── shared/          → Configuração, logger, constantes, tokens DI
```

**Regra de dependência**: as camadas internas (`domain`, `application`) nunca importam das externas (`infrastructure`, `presentation`). A inversão de dependência é feita via interfaces (Ports) e tokens de injeção do NestJS.

**Por que Clean Architecture?**

- **Testabilidade**: a camada de domínio é pura — sem dependências de framework. Use Cases recebem Ports injetados, permitindo testes unitários com mocks/in-memory sem banco, Redis ou API de IA.
- **Flexibilidade de provider**: trocar o Gemini por outro modelo (OpenAI, Anthropic, local) exige apenas uma nova implementação de `AiClientPort`, sem alterar nenhum Use Case.
- **Evolução independente**: regras de negócio (taxonomia, prioridades, validações de domínio) evoluem sem impactar infraestrutura e vice-versa.
- **Clareza de responsabilidade**: cada camada tem um papel bem definido, facilitando onboarding e code review.

A entidade `Report` possui lifecycle methods (`startClassification()`, `completeClassification()`, `failClassification()`) que encapsulam as transições de estado, garantindo invariantes do domínio. Value Objects como `ReportTitle`, `ReportDescription` e `Location` validam dados na criação, garantindo que objetos inválidos nunca existam no sistema.

---

### Estratégia de IDs: Inteiro Interno + UUID Externo

As tabelas `reports` e `classification_results` utilizam uma estratégia de **chave primária dupla**:

| Coluna | Tipo | Propósito |
|---|---|---|
| `id` | `integer` (auto-increment) | PK interna — índice clusterizado sequencial, otimizado para performance de escrita e joins |
| `external_id` | `uuid` (v4, unique) | ID exposto na API — não-enumerável, seguro para exposição pública |

**Motivações:**

1. **Performance no banco**: chaves primárias inteiras geram índices B-tree sequenciais, evitando page splits e fragmentação que UUIDs v4 causam em índices clusterizados. Inserções são append-only, e joins entre tabelas são mais eficientes com inteiros de 4 bytes vs. UUIDs de 16 bytes.
2. **Segurança**: expor IDs inteiros sequenciais na API permitiria enumeração de recursos (IDOR). O `external_id` (UUID v4) é criptograficamente aleatório, tornando impraticável adivinhar IDs de outros relatos.
3. **Separação de responsabilidades**: a camada de domínio trabalha apenas com o `external_id` (string UUID) como identificador. O `id` inteiro nunca escapa da camada de infraestrutura (ORM/repositório).

**Mapeamento no repositório:**

```
Domínio (entity.id)  ↔  ORM (entity.externalId)   — UUID exposto na API
                        ORM (entity.id)            — inteiro interno (nunca exposto)
```

A relação entre `classification_results` e `reports` utiliza o `external_id` como FK, mantendo a integridade referencial sem expor IDs internos entre camadas.

---

### Processamento Assíncrono com Fila

A classificação por IA é desacoplada do request HTTP usando **BullMQ** com **Redis** como broker:

| Configuração | Valor |
|---|---|
| Nome da fila | `report-classification` |
| Concorrência do worker | 3 jobs simultâneos |
| Tentativas máximas | 3 |
| Estratégia de backoff | Exponencial: `3s × 2^attempt` |
| Remoção após sucesso | Sim (`removeOnComplete: true`) |
| Remoção após falha | Não (`removeOnFail: false`) — permite inspeção |

**Fluxo da fila:**

1. **Producer** (`ClassificationProducer`): ao criar um report, o Use Case publica um job com o `reportId` como `jobId` (deduplicação nativa do BullMQ — impede que o mesmo report seja enfileirado duas vezes).
2. **Processor** (`ClassificationProcessor`): consome jobs com concorrência 3. Delega ao `ProcessClassificationUseCase`, passando `job.attemptsMade + 1`.
3. **Idempotência**: antes de processar, o Use Case verifica se o report já está `DONE`. Se estiver, ignora silenciosamente (idempotência em caso de reprocessamento).
4. **Retry**: se o Use Case lança exceção, o BullMQ agenda uma nova tentativa com backoff exponencial. O report é marcado como `FAILED` com o error registrado para observabilidade.

---

### Integração com IA (Google Gemini)

A classificação utiliza o **Google Gemini** (modelo `gemini-3-flash-preview`) com as seguintes medidas de qualidade e segurança:

#### Estrutura do Prompt

O prompt é construído por funções puras em `prompt-builder.ts` (camada de application — sem dependência de provider):

- **System Instruction**: define a persona ("Agente de Classificação de Serviços Públicos Municipais"), missão, contrato de saída JSON, taxonomia completa (9 categorias com subcategorias), diretrizes de prioridade por categoria, regras de conflito, e diretivas de determinismo.
- **User Message**: encapsula o relato em tags XML-like (`<relato>`, `<titulo>`, `<descricao>`, `<localizacao>`) para delimitar dados de instruções.
- **Repair Message**: se a primeira resposta for inválida, um prompt de reparo é enviado incluindo o erro Zod, a resposta original e as listas de valores válidos.

#### Classificação Bottom-Up

O modelo identifica primeiro a **subcategoria** mais específica do problema e, a partir dela, deriva a **categoria-pai** pela taxonomia. A subcategoria é usada apenas no raciocínio interno — não aparece na saída JSON. Isso reduz erros de classificação onde o mesmo sintoma pode pertencer a categorias diferentes (ex: "esgoto vazando em buraco na rua" → risco sanitário prevalece sobre dano viário).

#### Anti-Alucinação

O prompt inclui regras explícitas proibindo o modelo de:
- Inventar endereços ou detalhes ausentes
- Escalar severidade sem justificativa textual
- Adicionar suposições, recomendações ou análises extras
- Seguir instruções incorporadas nos campos do relato (prompt injection defense)

Quando informações são incompletas, o modelo deve escolher prioridade conservadora.

#### JSON Estruturado e Validação

- **Saída forçada**: `responseMimeType: 'application/json'` + `responseJsonSchema` (derivado do Zod via `zod-to-json-schema`) — o Gemini retorna JSON schema-compliant diretamente.
- **Validação dupla**: mesmo com JSON forçado, a resposta é parseada e validada com Zod (`category` deve ser um dos 9 valores exatos, `priority` um dos 3, `technical_summary` entre 1–600 chars).
- **Repair retry**: se a validação Zod falhar, um repair prompt é enviado uma vez. Se falhar novamente, lança `AiValidationError` ou `AiInvalidJsonError`.

#### Safety Settings

O cliente Gemini configura `BLOCK_ONLY_HIGH` para todas as 4 categorias de harm. Esse é o threshold mais permissivo que ainda bloqueia conteúdo de alta severidade — escolhido porque este é um serviço de triagem municipal que processa reclamações reais de cidadãos:

| Categoria | Threshold | Motivo |
|---|---|---|
| **Harassment** | `BLOCK_ONLY_HIGH` | Relatos podem conter linguagem rude ou frustrada |
| **Hate Speech** | `BLOCK_ONLY_HIGH` | Evita falsos positivos em descrições de edge-case |
| **Sexually Explicit** | `BLOCK_ONLY_HIGH` | Improvável em relatos urbanos, mas previne bloqueios indevidos |
| **Dangerous Content** | `BLOCK_ONLY_HIGH` | Relatos sobre fios expostos, vazamento de gás, risco de desabamento são problemas municipais legítimos |

Respostas bloqueadas por safety são detectadas em dois níveis:
- **Prompt-level**: `promptFeedback.blockReason` presente.
- **Output-level**: `finishReason` é `SAFETY`, `RECITATION`, `BLOCKLIST` ou `PROHIBITED_CONTENT`.

`AiSafetyBlockedError` é lançado nesses casos. O `ProcessClassificationUseCase` captura esse erro, marca o relato como `FAILED`, mas **não re-lança a exceção** — evitando retries infinitos no BullMQ, já que o bloqueio é determinístico.

#### Truncação por Limite de Tokens

Quando `finishReason` é `MAX_TOKENS`, a resposta JSON foi cortada por exceder `maxOutputTokens`. O `GeminiClient` detecta isso e lança `AiMaxTokensError` — um erro distinto de `AiSafetyBlockedError`. Como truncação por tokens **pode** ser resolvida em retry (o modelo pode gerar uma resposta mais curta), esse erro **é re-lançado** para que o BullMQ retente com backoff exponencial.

Respostas com JSON truncado por outros motivos (parse error "Unterminated string", "Unexpected end of JSON") seguem o fluxo normal de **repair retry**: o use case envia um repair prompt uma vez antes de falhar definitivamente.

#### Configuração do Modelo

| Parâmetro | Valor | Motivo |
|---|---|---|
| `temperature` | `0` | Determinismo máximo |
| `topP` | `1` | Sem nucleus sampling |
| `topK` | `1` | Apenas o token mais provável |
| `candidateCount` | `1` | Uma única resposta |
| `maxOutputTokens` | `1024` | Limita custo e tamanho |
| Timeout | Configurável via `GEMINI_TIMEOUT_MS` | Evita hang indefinido |

---

### Cache de Classificação

Para evitar chamadas redundantes à IA (custo e latência), o sistema implementa cache em **Redis** com as seguintes características:

- **Chave determinística**: SHA-256 hash gerado a partir de `[promptVersion, title, description, location]` normalizados (lowercase, whitespace colapsado, CEP apenas dígitos, endereço canonicalizado com chaves ordenadas).
- **Versionamento**: o hash inclui `PROMPT_VERSION` (`v4.0.0`), então mudanças no prompt invalidam automaticamente o cache.
- **TTL**: 24 horas (`SETEX`).
- **Prefixo**: `ai-cache:` para isolamento no Redis.
- **Resiliência**: entradas corrompidas são deletadas silenciosamente e tratadas como cache miss.
- **Fluxo**: antes de chamar o Gemini, o Use Case verifica o cache. Em caso de hit, pula completamente a chamada à IA.

---

### Testes Automatizados

O projeto utiliza **Vitest** (com SWC para transpilação rápida) e segue a pirâmide de testes:

#### Testes Unitários (22 arquivos)

- **Domain**: ciclo de vida da entidade Report (create, transitions), validação de Value Objects (título vazio, descrição vazia, localização inválida).
- **Application**: Use Cases testados com mocks injetados — `CreateReportUseCase`, `ProcessClassificationUseCase` (happy path, idempotência, falha), `ClassifyReportUseCase` (cache hit, repair retry, dupla falha, timeout, safety block).
- **Application/AI**: prompt builder (output verification), normalization (SHA-256 determinism), validators (Zod schema), mapper.
- **Infrastructure**: mapeamento de/para ORM entities, Gemini client (mocks do SDK), Redis cache adapter.
- **Presentation**: controller (delegação ao use case), schemas Zod de validação de DTOs.
- **Shared**: validação de variáveis de ambiente, domain exception filter.

#### Testes de Integração (2 arquivos)

- **Reports** (`reports.spec.ts`): módulo NestJS self-contained (sem DB/Redis real) com SuperTest. Testa `POST /api/reports`: sucesso, erros de validação, erros de domínio, falha na fila.
- **Process Classification** (`process-classification.spec.ts`): 5 cenários end-to-end com repositórios in-memory: happy path, report não encontrado, idempotência, falha na IA → FAILED, retry de FAILED → DONE.

#### Helpers de Teste

- `InMemoryReportRepository` e `InMemoryClassificationResultRepository` para testes sem banco.
- Factories de mocks: `createMockLogger()`, `createFakeClock()`, `createMockQueueProducer()`, `createMockAiClient()`, `createMockCache()`, etc.
- Fixtures com dados válidos de classificação.

```bash
# Executar todos os testes
npm run api:test

# Executar em modo watch
npm run -w @colab-challenger/api test:watch

# Executar com cobertura
npm run -w @colab-challenger/api test:cov
```

---

## Arquitetura do Frontend

### Stack Técnico

O frontend é uma SPA (Single Page Application) construída com o seguinte stack:

| Tecnologia | Versão | Propósito |
|---|---|---|
| **React** | 19 | Biblioteca de UI |
| **TypeScript** | 5.7 | Tipagem estática |
| **Vite** | 7 + SWC | Build tool e compilação rápida |
| **TanStack Form** | 1.28 | Gerenciamento de formulários (headless, type-safe) |
| **TanStack Router** | 1.163 | Roteamento client-side com tipagem |
| **Zod** | 3.25 | Validação de schemas (Standard Schema) |
| **Tailwind CSS** | 4 | Utility-first CSS |
| **Radix UI** | — | Primitivos acessíveis (label, select, toast) |
| **shadcn/ui** | New York | Componentes copiados (não instalados como dependência) |
| **Phosphor Icons** | 2.1 | Biblioteca de ícones |
| **Framer Motion** | 12.6 | Animações |
| **Axios** | 1.13 | Cliente HTTP |
| **Playwright** | 1.58 | Testes E2E |

**Por que TanStack Form (e não React Hook Form)?**

- Suporte nativo a **Standard Schema** (Zod 3.25+ sem adapter) — um `z.object()` é passado diretamente como `validators.onChange`, sem wrappers como `zodResolver()`.
- API headless com controle total sobre renderização — sem componentes `<Controller>` ou `<FormProvider>`.
- Tipagem end-to-end: o tipo do campo é inferido do schema, sem casts manuais.

**Por que Vite + SWC (e não Webpack/Babel)?**

- HMR em milissegundos (ESM nativo no dev, sem bundle).
- SWC compila TypeScript/JSX ~20x mais rápido que Babel.
- Configuração mínima: 2 plugins (`react-swc`, `tailwindcss`).

---

### Organização por Features

O código segue uma organização **feature-based**, onde cada domínio funcional agrupa seus próprios componentes, hooks, serviços, tipos e validadores:

```
src/
├── features/
│   └── reports/                  # Feature: relatos urbanos
│       ├── components/           # Componentes específicos da feature
│       │   ├── ReportForm.tsx    # Formulário principal
│       │   └── ConfirmationSummary.tsx  # Resumo pós-submissão
│       ├── hooks/                # Lógica de estado e side-effects
│       │   ├── useCepLookup.ts   # Busca de CEP com debounce
│       │   └── useSubmitReport.ts # Submissão do relato
│       ├── services/             # Clientes HTTP
│       │   ├── reportsService.ts # POST /api/reports
│       │   └── viaCepService.ts  # API ViaCEP (externa)
│       ├── types/                # Interfaces e tipos
│       │   └── reportTypes.ts    # Payloads e responses
│       └── validators/           # Schemas de validação
│           └── reportSchemas.ts  # Zod schemas com i18n
├── pages/                        # Páginas (composição de features)
│   ├── HomePage.tsx              # Hero + benefícios + formulário
│   └── ConfirmationPage.tsx      # Sucesso + resumo + CTA
├── shared/                       # Código compartilhado entre features
│   ├── components/               # AppHeader, LanguageSwitcher, ThemeSwitcher
│   ├── i18n/                     # Sistema de internacionalização
│   └── theme/                    # Sistema de tematização
├── components/ui/                # Primitivos de UI (shadcn/ui)
├── hooks/                        # Hooks genéricos (useIsMobile, useToast)
├── lib/                          # Utilitários puros (cn, formatCep, extractErrors)
├── router/                       # Configuração de rotas
└── styles/                       # CSS global e paleta de cores
```

**Por que feature-based (e não layer-based)?**

- **Coesão**: tudo relacionado a "relatos" está em `features/reports/`. Um dev novo não precisa navegar entre `components/`, `hooks/`, `services/` espalhados na raiz.
- **Escalabilidade**: adicionar uma nova feature (ex: `features/dashboard/`) não impacta e nem polui as existentes.
- **Delete-friendly**: remover uma feature é deletar uma pasta, sem caçar imports em 10 diretórios diferentes.

A camada `shared/` contém apenas código genuinamente transversal (i18n, theme, header). Componentes UI primitivos ficam em `components/ui/` por serem agnósticos de feature.

---

### Formulários e Validação

O formulário de relatos é o ponto central do frontend. A arquitetura de validação segue um fluxo integrado:

#### Zod Standard Schema + TanStack Form

Os schemas de validação são definidos com **Zod 3.25** e passados diretamente ao TanStack Form via **Standard Schema** — sem adapters ou resolvers:

```typescript
// validators/reportSchemas.ts
export const createFieldSchemas = (t: TranslationFn) => ({
  title: z.string().min(5, t('validation.title.min')).max(255, t('validation.title.max')),
  description: z.string().min(15, t('validation.description.min')),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, t('validation.cep.format')),
  state: z.string().regex(/^[A-Z]{2}$/, t('validation.state.format')),
  // ...
})
```

As mensagens de erro são i18n-ready: `createFieldSchemas(t)` recebe a função de tradução e injeta diretamente nos schemas Zod. Isso evita mapeamento manual de códigos de erro para mensagens.

#### CEP Auto-Fill com Debounce

O hook `useCepLookup` encapsula a busca de endereço via API ViaCEP:

1. Cidadão digita o CEP → input aplica máscara (`formatCep`: `01001000` → `01001-000`).
2. Ao completar 8 dígitos, o debounce (400ms) dispara o lookup.
3. Em caso de sucesso, os campos rua, bairro, cidade e estado são preenchidos automaticamente.
4. Em caso de CEP não encontrado, um toast de aviso é exibido.
5. Requisições em voo são canceladas via `AbortController` ao digitar um novo CEP.

#### Componentes Reutilizáveis de Formulário

Para evitar repetição (~15 linhas por campo × 9 campos), o projeto extrai dois componentes:

- **`FormField`**: wrapper genérico com label, asterisco de obrigatório, helper text e mensagem de erro.
- **`FormInputField`**: especialização que conecta `FormField` + `Input` ao estado do TanStack Form e extrai erros do Zod automaticamente via `extractErrors()`.

---

### Sistema de Design

O frontend utiliza **shadcn/ui** (variante New York) como base de componentes, combinado com **Radix UI** para acessibilidade e **Tailwind CSS 4** para estilização:

| Componente | Base | Características |
|---|---|---|
| Button | CVA | 6 variantes (default, destructive, outline, secondary, ghost, link), 4 tamanhos, spinner de loading |
| Input | HTML + Tailwind | Focus ring, estados `aria-invalid`, composição livre |
| Select | Radix | Acessível (keyboard nav, screen readers), scroll buttons, separator |
| Toast | Radix | Variantes (default, destructive), limite de 1 visível, reducer-based |
| Card | Tailwind | Header, Title, Description, Action, Content, Footer |
| Alert | CVA + ícones | 6 variantes com ícones automáticos (info, success, warning, error) |
| FormField | Custom | Label com asterisco, helper text, erro — agnóstico de form library |

**Por que shadcn/ui (e não Material UI, Ant Design ou Chakra)?**

- **Ownership de código**: componentes são copiados para `components/ui/`, não instalados como dependência. Customização total sem override de estilos internos.
- **Zero runtime**: sem CSS-in-JS, sem theme provider pesado. Apenas classes Tailwind.
- **Composição**: cada componente é um primitivo pequeno (~30–80 linhas), composto livremente sem hierarquia de `<ThemeProvider>` → `<CssBaseline>` → `<Component>`.
- **Acessibilidade nativa**: Radix primitives garantem ARIA roles, keyboard navigation e focus management out-of-the-box.

#### Sistema de Cores (OKLCH)

As cores são definidas com **OKLCH** (Oklch color space) — um espaço de cor perceptualmente uniforme, alternativa moderna ao HSL/hex:

```css
:root {
  --background: oklch(0.98 0 0);
  --primary: oklch(0.45 0.15 250);
  --destructive: oklch(0.55 0.22 25);
}
.dark {
  --background: oklch(0.12 0.02 250);
  --primary: oklch(0.55 0.18 250);
}
```

OKLCH garante que cores com a mesma lightness pareçam igualmente luminosas ao olho humano (diferente de HSL, onde `hsl(60, 100%, 50%)` amarelo parece muito mais claro que `hsl(240, 100%, 50%)` azul). A paleta é complementada por **Radix Colors** para tons semânticos.

---

### Internacionalização (i18n)

O sistema de i18n é implementado via **Context API** + **localStorage**, sem dependência de bibliotecas como `react-intl` ou `i18next`:

| Aspecto | Detalhe |
|---|---|
| Idiomas | `ptBR` (padrão), `enUS` |
| Chaves | Hierárquicas: `t('form.labels.title')` |
| Persistência | `localStorage` (chave: `municipal-service-lang`) |
| Cobertura | ~80 chaves: header, hero, benefits, form, validation, errors, confirmation |
| Integração Zod | `createFieldSchemas(t)` injeta mensagens traduzidas nos schemas |

**Por que Context API (e não react-intl/i18next)?**

- O app tem **2 idiomas** e **~80 chaves**. Bibliotecas como i18next adicionam ~40KB gzipped, suporte a pluralização complexa, namespaces, lazy loading de dicionários — funcionalidades desnecessárias para este escopo.
- A implementação completa (provider, hook, traduções) soma ~200 linhas. O custo de manutenção é menor que o de aprender e configurar i18next.
- A função `t()` resolve chaves hierárquicas com travessia recursiva de objetos — `t('hero.title')` acessa `translations.ptBR.hero.title`.

O componente `LanguageSwitcher` utiliza um `<Select>` Radix com ícone de globo, persistindo a preferência no `localStorage`.

---

### Tematização (Dark/Light)

O sistema de temas utiliza **CSS variables** com toggle baseado em classe no `<html>`:

1. O `ThemeProvider` lê a preferência do `localStorage` (chave: `municipal-service-theme`, default: `dark`).
2. Aplica `class="light"` ou `class="dark"` no elemento `<html>`.
3. Tailwind CSS 4 resolve variantes escuras via `@custom-variant dark (&:is(.dark *))`.
4. Todas as cores de componentes referenciam CSS variables (`var(--background)`, `var(--primary)`), que mudam conforme a classe ativa.

O toggle é um botão ghost com ícone Sun/Moon (Phosphor Icons), acessível via `aria-label` i18n.

---

### Roteamento e Navegação

O app possui **2 rotas** gerenciadas pelo **TanStack Router**:

| Rota | Página | Propósito |
|---|---|---|
| `/` | `HomePage` | Hero, benefícios e formulário de relato |
| `/confirmation` | `ConfirmationPage` | Confirmação pós-submissão com resumo |

**Passagem de dados via navigation state:**

Após submissão bem-sucedida, o frontend navega para `/confirmation` passando os dados do relato via `navigate({ to: '/confirmation', state: { reportId, title, location, classificationStatus } })`. Isso evita:

- **Global state** (Redux/Zustand) para dados efêmeros usados apenas uma vez.
- **Query params** para dados complexos (objeto `location` com 7 campos).
- **Chamada extra à API** para buscar dados que já estão em memória.

A `ConfirmationPage` valida o state recebido com um **type guard** (`isConfirmationState()`). Se o usuário acessar `/confirmation` diretamente (sem state), um fallback é exibido com mensagem "sem dados" e botão para voltar ao formulário.

---

### Testes E2E (Playwright)

O frontend utiliza **Playwright** com **Chromium** para testes end-to-end, seguindo os princípios **F.I.R.S.T** (Fast, Independent, Repeatable, Self-validating, Timely):

#### Arquitetura dos Testes

```
e2e/
├── fixtures/
│   ├── test-data.ts        # Dados determinísticos (CEP, relato, respostas mock)
│   └── mock-routes.ts      # Funções reutilizáveis para interceptar ViaCEP e API
├── pages/
│   ├── home.page.ts        # Page Object: formulário, campos, ações
│   └── confirmation.page.ts # Page Object: resumo, CTA, fallback
└── tests/
    ├── form-validation.spec.ts    # Validação de campos (6 testes)
    ├── cep-lookup.spec.ts         # Máscara, auto-fill, CEP não encontrado (3 testes)
    ├── report-submission.spec.ts  # Happy path e erro de API (2 testes)
    ├── i18n.spec.ts               # Troca de idioma e persistência (4 testes)
    ├── theme.spec.ts              # Alternância light/dark (3 testes)
    ├── confirmation.spec.ts       # Estado presente e fallback (2 testes)
    └── accessibility.spec.ts      # ARIA labels, form labels, responsive (5 testes)
```

#### Mocking Determinístico

Todas as chamadas de rede são interceptadas via `page.route()` com fixtures estáticas, garantindo **determinismo** e **independência** de serviços externos:

- **ViaCEP**: `mockViaCep(page)` intercepta `**/viacep.com.br/**` e retorna dados fixos (Praça da Sé, São Paulo).
- **API Backend**: `mockReportsApi(page)` intercepta `**/api/reports` e retorna um report com `classificationStatus: PENDING`.
- **Cenários de erro**: `mockViaCepNotFound(page)` e `mockReportsApiError(page, 500)` simulam falhas.

Isso elimina dependência de internet, backend rodando, ou estado do banco — os testes rodam em isolamento completo.

#### Page Object Model (POM)

Cada página tem um objeto dedicado com locators e métodos de interação, evitando selectors duplicados nos testes:

```typescript
// Exemplo de uso no teste
const home = new HomePage(page)
await home.goto()
await mockApiRoutes(page)
await home.fillReport(VALID_REPORT)
await home.fillCep(VALID_CEP)
await home.submit()
```

```bash
# Executar testes E2E
npm run test:web

# Executar com UI visual
npm run test:web:ui
```

---

## API — Endpoints

### `POST /api/reports`

Recebe um relato de problema urbano e enfileira para classificação.

**Request Body:**

```json
{
  "title": "Buraco na Rua Principal",
  "description": "Buraco grande próximo ao cruzamento causando congestionamento.",
  "location": {
    "street": "Praça da Sé",
    "number": "123",
    "complement": "Bloco B",
    "neighborhood": "Sé",
    "city": "São Paulo",
    "state": "SP",
    "postcode": "01001-000"
  }
}
```

**Response (`201 Created`):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "title": "Buraco na Rua Principal",
  "description": "Buraco grande próximo ao cruzamento causando congestionamento.",
  "location": {
    "street": "Praça da Sé",
    "number": "123",
    "complement": "Bloco B",
    "neighborhood": "Sé",
    "city": "São Paulo",
    "state": "SP",
    "postcode": "01001-000"
  },
  "classificationStatus": "PENDING"
}
```

**Respostas de Erro:**

| Status | Cenário |
|---|---|
| `400 Bad Request` | Campo obrigatório ausente, tipo inválido ou campo desconhecido no body |
| `422 Unprocessable Entity` | Violação de regra de domínio (ex: título vazio após trim) |
| `500 Internal Server Error` | Erro inesperado no servidor |

### Swagger UI

Documentação interativa disponível em `http://localhost:3000/api/docs` com exemplos de request/response para todos os cenários de sucesso e erro.

---

## Estrutura de Pastas

```
colab-challenger/
├── apps/
│   ├── api/                          # Backend NestJS
│   │   ├── src/
│   │   │   ├── domain/               # Entidades, Value Objects, exceções, repositórios (interfaces)
│   │   │   ├── application/           # Use Cases, Ports, lógica de negócio de IA
│   │   │   ├── infrastructure/        # TypeORM, Redis, Gemini client, BullMQ
│   │   │   ├── presentation/          # Controllers HTTP, DTOs, filtros de exceção
│   │   │   └── shared/                # Config, logger, constantes, tokens DI
│   │   └── test/
│   │       ├── helpers/               # In-memory repos, mocks, fixtures
│   │       ├── unit/                  # 22 arquivos de testes unitários
│   │       └── integration/           # Testes E2E com SuperTest
│   └── web/                           # Frontend React
│       ├── src/
│       │   ├── features/reports/      # Componentes, hooks, serviços, validadores, tipos
│       │   ├── pages/                 # HomePage, ConfirmationPage
│       │   ├── shared/                # i18n, theme, componentes reutilizáveis
│       │   ├── components/ui/         # Primitivos shadcn/ui (Button, Input, Select, Toast...)
│       │   ├── hooks/                 # useIsMobile, useToast
│       │   ├── lib/                   # Utilitários puros (cn, formatCep, extractErrors)
│       │   ├── router/                # TanStack Router (2 rotas)
│       │   └── styles/                # Paleta de cores OKLCH
│       └── e2e/                       # Testes Playwright
│           ├── fixtures/              # Dados mock e interceptadores de rota
│           ├── pages/                 # Page Objects (Home, Confirmation)
│           └── tests/                 # 7 specs (~25 testes)
├── docs/                              # Documentação de referência
├── scripts/                           # dev.sh, start_local.sh
├── docker-compose.yml                 # PostgreSQL, Redis, App
└── package.json                       # Monorepo (npm workspaces)
```

---

## Convenção de Idioma

O projeto adota uma convenção deliberada de idioma misto (pt-BR e inglês), seguindo o contexto de uso e as convenções da comunidade de desenvolvimento:

| Contexto | Idioma | Justificativa |
|---|---|---|
| Código-fonte (classes, variáveis, funções) | **Inglês** | Convenção da comunidade de desenvolvimento |
| Prompt da IA (system instruction, taxonomia) | **pt-BR** | O modelo classifica relatos em português; categorias e prioridades são em pt-BR |
| README e documentação do projeto | **pt-BR** | Projeto voltado para apresentação técnica no Brasil |
| Valores persistidos no banco (categorias, prioridades, resumos) | **pt-BR** | Dados de domínio brasileiro |
| Swagger: descrições e nomes de atributos | **Inglês** | Padrão OpenAPI — atributos seguem o código |
| Swagger: exemplos de request | **pt-BR** | Consistência com o README e com dados reais de uso |
| Frontend: interface do usuário (i18n) | **pt-BR / en-US** | Suporte bilíngue via sistema de internacionalização |

> **Regra prática:** código e metadados técnicos em inglês; conteúdo de domínio, documentação e exemplos voltados ao usuário em pt-BR.

---

## Documentação Complementar

| Documento | Conteúdo |
|---|---|
| [ARCHITECTURE_REFERENCE.md](docs/ARCHITECTURE_REFERENCE.md) | Referência completa de camadas, regras de dependência, design de BD e trade-offs |
| [AUTOMATED_TESTING_PRINCIPLES_REFERENCE.md](docs/AUTOMATED_TESTING_PRINCIPLES_REFERENCE.md) | Princípios FIRST, determinismo, pirâmide de testes |
| [CLEAN_CODE_PRINCIPLES_REFERENCE.md](docs/CLEAN_CODE_PRINCIPLES_REFERENCE.md) | DRY, KISS, YAGNI, SOLID, separação de concerns |
| [FUTURE_IMPROVEMENTS.md](docs/FUTURE_IMPROVEMENTS.md) | Roadmap: DLQ, métricas, rate limiting, SSE, graceful shutdown |
