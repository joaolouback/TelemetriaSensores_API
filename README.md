# UVV Go — API

API REST + WebSocket do projeto **UVV Go**: plataforma mobile gamificada baseada em
geolocalização e realidade aumentada para exploração do campus da Universidade Vila Velha.

Atende os pontos de interesse do campus, a validação de geofencing e a telemetria de
sensores herdada da Prova de Conceito (offline-first).

## Tecnologias
- **Node.js + Express** (servidor HTTP)
- **TypeScript**
- **Prisma ORM 7** + **PostgreSQL 16**
- **ws** (WebSocket para sincronização em tempo real)
- **Swagger** (documentação dos endpoints)

> **Primeira vez neste projeto?** Siga o **[SETUP.md](SETUP.md)** — roteiro passo a
> passo para subir backend e app do zero e testar no celular.

## Pré-requisitos
- Node.js 18+
- Docker (para subir o Postgres) — ou um Postgres já instalado

## Como rodar

1. **Instale as dependências**
   ```bash
   npm install
   ```

2. **Suba o banco**
   ```bash
   npm run db:up
   ```
   Sobe um Postgres 16 em `localhost:5432` (banco `uvvgo`, usuário/senha `postgres`).

3. **Configure o `.env`**
   O arquivo já vem pronto na raiz:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/uvvgo?schema=public"
   ```

4. **Crie as tabelas e popule os pontos do campus**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
   O seed cadastra os **10 pontos de coleta** definidos na metodologia do TCC.

5. **Inicie o servidor**
   ```bash
   npm run dev
   ```
   Você verá `-> Conectado ao banco de dados PostgreSQL (Prisma) com sucesso!`

Documentação interativa em `http://localhost:3000/api-docs`.

> **Coordenadas dos pontos:** as latitudes/longitudes em `prisma/seed.ts` são
> **aproximadas**, só para o mapa funcionar em desenvolvimento. Substitua pelos
> valores reais coletados em campo e rode `npm run db:seed` de novo (o seed é
> idempotente — atualiza os pontos existentes pelo nome).

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Sobe a API em modo desenvolvimento (auto-reload) |
| `npm run build` | Gera o Prisma Client e compila para `dist/` |
| `npm start` | Roda a versão compilada |
| `npm run db:up` | Sobe o Postgres via Docker |
| `npm run db:migrate` | Cria/aplica migrations |
| `npm run db:seed` | Popula os pontos de interesse e conquistas |
| `npm run db:studio` | Abre o Prisma Studio (navegador do banco) |
| `npm run db:reset` | Apaga e recria o banco do zero |

## Modelo de dados

Implementa o diagrama de classes do TCC (`prisma/schema.prisma`):

| Model | Papel |
| --- | --- |
| `Usuario` | Estudantes e administradores (distinguidos por `role`) |
| `PontoDeInteresse` | Os pontos de coleta do campus, com raio de geofence |
| `Objeto3D` | Modelo 3D renderizado via ARCore ao alcançar o ponto |
| `Interacao` | Registro de um usuário alcançando um ponto |
| `Conquista` / `UsuarioConquista` | Medalhas e o que cada usuário desbloqueou |
| `Ranking` | Classificação por pontuação |
| `TelemetriaSensor` | Telemetria de sensores da POC (substitui `sensor_logs`) |

## Endpoints

### Pontos de interesse

**`GET /api/pontos`** — lista os pontos ativos do campus (alimenta o mapa do app).
```json
{ "data": [ { "id": 1, "nome": "Prédio Azul", "latitude": -20.34105,
              "longitude": -40.2923, "raioGeofence": 30,
              "pontosRecompensa": 10 } ], "total": 10 }
```

**`GET /api/pontos/proximos?lat=&lon=`** — calcula a distância (Haversine) entre a
posição informada e cada ponto, indicando quais estão dentro do raio de geofence.
```json
{
  "origem": { "latitude": -20.34105, "longitude": -40.2923 },
  "data": [ { "nome": "Prédio Azul", "distanciaMetros": 0, "dentroDoRaio": true } ],
  "dentroDeAlgumRaio": ["Prédio Azul"]
}
```

**`GET /api/pontos/:id`** — detalha um ponto, incluindo o objeto 3D associado.

### Telemetria

**`POST /api/sync`** — sincronização em lote dos logs guardados offline no SQLite.
```http
POST http://localhost:3000/api/sync
Content-Type: application/json

[
  {
    "sensor_type": "combined",
    "latitude": -20.34105, "longitude": -40.2923,
    "accel_x": 0.1, "accel_y": 0.2, "accel_z": 9.8, "magnitude": 9.81,
    "battery_level": 0.85, "network_type": "wifi",
    "created_at": "2026-09-19T12:00:00Z"
  }
]
```
Resposta: `{ "message": "Sincronização realizada com sucesso", "insertedCount": 1 }`

**`GET /api/logs?page=1&limit=10`** — consulta paginada dos registros sincronizados.

### WebSocket (`ws://localhost:3000/ws`)

Envio:
```json
{ "type": "sync", "requestId": "abc123", "logs": [ /* ...mesmo formato do POST */ ] }
```
Resposta:
```json
{ "type": "sync_ack", "requestId": "abc123", "count": 1 }
```

## Observações

- O `POST /api/sync` aceita o payload em `snake_case` (formato do app) e converte
  para o schema do Prisma. Valores inválidos (`NaN`, datas quebradas) são saneados.
- O campo `usuarioId` em `TelemetriaSensor` é opcional, mantendo compatibilidade
  com as coletas anônimas do app atual.
