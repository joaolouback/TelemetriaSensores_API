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
   JWT_SECRET="troque-este-segredo"
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
| `npm run db:seed` | Popula os pontos de interesse, seus objetos 3D e as conquistas |
| `npm run modelos:gerar` | Regera o modelo 3D padrão (`public/modelos/cristal.glb`) |
| `npm run db:studio` | Abre o Prisma Studio (navegador do banco) |
| `npm run db:reset` | Apaga e recria o banco do zero |

## Arquitetura

O código é organizado **por módulo (domínio)**: cada funcionalidade tem sua pasta em
`src/modules/` com todas as camadas dela. O que é usado por todos fica em `src/shared/`.

```
src/
├── modules/
│   ├── auth/          registro, login e /auth/me
│   ├── usuario/       entidade, DTO público (sem senhaHash) e acesso aos dados
│   ├── conquista/     desbloqueio de conquistas pela pontuação
│   ├── ponto/         pontos de interesse, objetos 3D e cálculo de proximidade
│   ├── interacao/     check-in (coleta em AR)
│   ├── desafio/       desafio 1x1 (convite por código, corrida pelos pontos sorteados)
│   └── telemetria/    /sync, /logs e o WebSocket /ws
├── shared/
│   ├── database/      Prisma Client (singleton) e o tipo DbClient para transações
│   ├── errors/        AppError (erro de negócio com status HTTP)
│   ├── http/          asyncHandler e validar() (DTO com zod)
│   ├── middlewares/   autenticação JWT e tratamento central de erros
│   └── utils/         geo (Haversine) e jwt
├── app.ts             Express: middlewares, rotas dos módulos e errorMiddleware
├── server.ts          HTTP + WebSocket
└── swagger.ts         lê as anotações de src/modules/**/*.routes.ts
```

Dentro de cada módulo:

| Arquivo | Responsabilidade |
| --- | --- |
| `*.routes.ts` | Rotas Express + documentação Swagger |
| `*.controller.ts` | Lê `req`, valida o DTO, chama o service e responde. Sem regra de negócio nem Prisma |
| `*.service.ts` | Regras de negócio e acesso ao banco. Erros esperados viram `AppError(status, mensagem)` |
| `*.mapper.ts` | Converte entidade ⇄ DTO (ex.: `BigInt` → `number`, remover `senhaHash`, payload do app → Prisma) |
| `dto/` | Formatos de entrada (schemas zod, com as mensagens de erro) e de saída (interfaces) |
| `entities/` | Tipos do diagrama de classes, derivados dos models do Prisma |
| `*.gateway.ts` | Entrada via WebSocket (só em `telemetria`) |

Um módulo usa outro **pelo service** (ex.: `interacao` chama `usuarioService.adicionarPontos`
e `conquistaService.desbloquearPorPontuacao`). Os services que participam de uma transação
recebem o `tx` como primeiro parâmetro (`DbClient`).

## Modelo de dados

Implementa o diagrama de classes do TCC (`prisma/schema.prisma`):

| Model | Papel |
| --- | --- |
| `Usuario` / `Administrador` | Estudantes; os administradores têm também um registro em `Administrador` |
| `PontoDeInteresse` | Os pontos de coleta do campus, com raio de geofence, curiosidade e foto do card |
| `Objeto3D` | Modelo 3D renderizado via ARCore ao alcançar o ponto |
| `Interacao` | Registro de um usuário alcançando um ponto |
| `Conquista` / `UsuarioConquista` | Medalhas e o que cada usuário desbloqueou |
| `Ranking` | Classificação por pontuação |
| `TelemetriaSensor` | Telemetria de sensores da POC (substitui `sensor_logs`) |
| `Desafio` / `DesafioPonto` / `DesafioColeta` | Desafio 1x1: os jogadores, os pontos sorteados e quem coletou cada um (não estão no diagrama original — acrescentar) |

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

### Autenticação

**`POST /api/auth/registro`** — cria a conta. Corpo: `{ "nome", "email", "senha" }` (senha ≥ 6).
**`POST /api/auth/login`** — corpo: `{ "email", "senha" }`.

Ambos respondem `{ "token": "<JWT>", "usuario": { "id", "nome", "email", ... } }`.
O token vale 30 dias e vai no header `Authorization: Bearer <token>`.

**`GET /api/auth/me`** — dados do usuário do token.

**Limite de tentativas** (proteção contra força bruta, responde `429`): 10 senhas erradas
por e-mail e IP a cada 15 min — no Wi-Fi do campus vários alunos dividem o IP, então errar
a senha de uma conta não bloqueia as outras — e 30 cadastros por IP a cada 15 min.

No Swagger (`/api-docs`), use o botão **Authorize** e cole o token para testar as rotas protegidas.

### Check-in (coleta em realidade aumentada)

Ao entrar no raio de um ponto, o app libera a câmera AR. O objeto 3D do ponto aparece
sobre o chão (ARCore) e **só ao tocar nele** o app chama o check-in:

**`POST /api/interacoes`** — requer `Authorization: Bearer <token>`.
```json
{ "pontoId": 1, "latitude": -20.34105, "longitude": -40.2923, "precisao": 8, "mockado": false }
```
`precisao` (metros, `coords.accuracy`) e `mockado` (`location.mocked` do Android) são
opcionais. O servidor **revalida o geofence** com a posição enviada (não confia na
distância do aparelho) e registra uma `Interacao`:

| Situação | Resposta | Efeito |
| --- | --- | --- |
| Dentro do raio, 1ª coleta | `201` | `validadoGeofence = true`, soma `pontosRecompensa` em `pontuacaoTotal`, desbloqueia conquistas |
| Fora do raio | `422` (com `distanciaMetros`) | Tentativa registrada com `validadoGeofence = false`, sem pontos |
| GPS falso (`mockado: true`) ou `precisao` > 50 m | `422` | Nada é registrado |
| Ponto já coletado | `409` | Nada — cada ponto rende pontos uma única vez por usuário |

> **Anti-trapaça:** como o servidor só conhece a posição que o celular informa, ele recusa
> as que o próprio Android marca como simuladas (apps de "fake GPS") e as imprecisas demais
> para garantir presença num raio de 20–30 m. O modo simulação do app existe só em
> desenvolvimento e não vai para o build final.

```json
{ "pontosGanhos": 10, "pontuacaoTotal": 25, "distanciaMetros": 4.2,
  "novasConquistas": [ { "id": 1, "titulo": "Primeiros Passos", ... } ], "interacao": { ... },
  "desafio": { "desafioId": 3, "coletados": 2, "total": 3, "finalizado": false, "resultado": null, "bonus": 0 } }
```
`desafio` só vem preenchido quando o ponto faz parte do desafio 1x1 em andamento (veja abaixo).

**`GET /api/interacoes/minhas`** — `{ "pontosColetados": [1, 4], "pontuacaoTotal": 25 }`.
O app usa para não oferecer a câmera em pontos já coletados.

**Modelos 3D:** servidos em `/modelos/*.glb` (pasta `public/modelos/`). O `assetUrl` do
`Objeto3D` pode ser relativo (`/modelos/cristal.glb`, completado pelo app com o endereço
da API) ou uma URL absoluta. Para usar um modelo próprio, coloque o `.glb` na pasta e
ajuste `OBJETO_3D_PADRAO` (ou cada ponto) em `prisma/seed.ts`.

**Card do local:** depois da coleta, o app mostra a `descricao`, a `curiosidade` e a foto
(`imagemUrl`) do ponto, que vêm em `GET /api/pontos`. As fotos ficam em `public/imagens/`
(servidas em `/imagens/*`). Preencha `curiosidade` e `imagemUrl` em `prisma/seed.ts` com
conteúdo verificado e rode `npm run db:seed`.

### Desafio 1x1

Um jogador cria o desafio e manda o **código de 6 caracteres** para o amigo. Quando o amigo
entra, começa uma **corrida de 1 hora** pelos **3 pontos sorteados**: quem coletar todos
primeiro vence e ganha **+20 pontos**. Se o tempo acabar, vence quem coletou mais (ou empate).
Cada jogador participa de um desafio por vez. Todas as rotas exigem token.

| Rota | O que faz |
| --- | --- |
| `POST /api/desafios` | Cria (status `AGUARDANDO`), sorteia os pontos e devolve o `codigo`. O convite vale 30 min |
| `POST /api/desafios/entrar` | Corpo `{ "codigo": "K7Q2MX" }`. Começa a partida (`EM_ANDAMENTO`, `terminaEm` = +1 h) |
| `GET /api/desafios/atual` | `{ desafio }`: o ativo ou o que terminou há menos de 30 min (para ver o resultado) |
| `POST /api/desafios/:id/sair` | Antes de começar, cancela; durante, é desistência — o oponente vence |
| `GET /api/desafios/historico` | Últimos 20 desafios e o placar de vitórias, derrotas e empates |

- **Coleta no desafio:** o check-in normal (`POST /api/interacoes`) conta para o desafio quando o
  ponto é um dos sorteados — **mesmo que já tenha sido coletado antes** no jogo normal (nesse
  caso rende 0 pontos normais, só o progresso no desafio).
- **Sem tarefa agendada:** convites e partidas vencidos são encerrados na próxima consulta.
  O desafio devolve `agora` (hora do servidor) para o cronômetro do app não depender do
  relógio do celular.
- **Concorrência:** toda mudança de estado trava a linha do desafio — se os dois completam ao
  mesmo tempo, ou entram com o mesmo código, só um resultado vale.
- **Testar sozinho:** use o Swagger como segundo jogador — crie uma conta, faça login,
  clique em *Authorize* e use `POST /api/desafios/entrar` com o código mostrado no app.

### Telemetria

**`POST /api/sync`** — sincronização em lote dos logs guardados offline no SQLite.
As colunas seguem a classe `TelemetriaSensor` do diagrama. Se o header
`Authorization` for enviado, os registros são associados ao usuário do token; sem ele,
ficam anônimos. O app envia em lotes de até 200 registros (o corpo aceita até 2 MB;
acima disso a resposta é `413`).
```http
POST http://localhost:3000/api/sync
Content-Type: application/json
Authorization: Bearer <token>

[
  {
    "latitude": -20.34105, "longitude": -40.2923,
    "acelerometro_x": 0.1, "acelerometro_y": 0.2, "acelerometro_z": 9.8,
    "magnitude": 9.81, "nivel_bateria": 85, "tipo_rede": "wifi",
    "timestamp": "2026-09-19T12:00:00Z"
  }
]
```
Resposta: `{ "message": "Sincronização realizada com sucesso", "insertedCount": 1 }`

**`GET /api/logs?page=1&limit=10`** — consulta paginada dos registros sincronizados.
Requer token. Como a telemetria contém a localização das pessoas, cada usuário vê **só os
próprios registros**; quem tem registro na tabela `administrador` vê todos.

### WebSocket (`ws://localhost:3000/ws`)

Envio:
```json
{ "type": "sync", "requestId": "abc123", "token": "<JWT opcional>", "logs": [ /* ...mesmo formato do POST */ ] }
```
Resposta:
```json
{ "type": "sync_ack", "requestId": "abc123", "count": 1 }
```

## Observações

- O `POST /api/sync` aceita o payload em `snake_case` (formato do app) e converte
  para o schema do Prisma. Valores inválidos (`NaN`, datas quebradas) são saneados.
  Os nomes antigos do app (`accel_x`, `battery_level`, `network_type`, `created_at`)
  continuam aceitos, para aparelhos que ainda não atualizaram.
- O campo `usuarioId` em `TelemetriaSensor` é opcional: com consentimento, o app
  pode coletar antes do login. O dono dos registros vem **só do token** — um
  `usuario_id` no corpo é ignorado, para ninguém gravar telemetria em nome de outro.
- **LGPD:** o app só coleta telemetria depois que o usuário aceita (tela de
  consentimento na primeira abertura; pode desligar no Perfil, o que apaga do aparelho
  o que ainda não foi enviado). Sem o aceite, o jogo funciona igual.
