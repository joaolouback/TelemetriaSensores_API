# UVV Go — Guia de instalação e teste

Roteiro para subir o projeto do zero em um computador novo e testar o app no celular.

O projeto tem **duas partes**, que rodam ao mesmo tempo:

| Parte | Repositório | O que é |
| --- | --- | --- |
| Backend | `TelemetriaSensores_API` | API REST + WebSocket + banco PostgreSQL |
| App | `TelemetriaSensores` | Aplicativo Android (React Native / Expo) |

---

## 1. Pré-requisitos

Instale no computador:

- **[Node.js 18 ou superior](https://nodejs.org)** — confira com `node --version`
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** — usado para subir o banco de dados
- **[Git](https://git-scm.com/downloads)**
- **[Android Studio](https://developer.android.com/studio)** — necessário para compilar o app
  (a realidade aumentada usa ARCore, que **não roda no Expo Go**). Na instalação, deixe
  marcados *Android SDK* e *Android SDK Platform-Tools*. O Android Studio já traz o JDK.

No **celular Android**:

- Um aparelho **compatível com ARCore** ([lista oficial](https://developers.google.com/ar/devices))
  com o app **Google Play Services para RA** (instalado automaticamente na maioria dos aparelhos)
- **Depuração USB** ativada: *Configurações → Sobre o telefone →* toque 7× em *Número da versão*,
  depois *Opções do desenvolvedor → Depuração USB*

> **Importante:** o celular e o computador precisam estar na **mesma rede Wi-Fi**.
> Não funciona com o celular no 4G, nem em redes que isolam dispositivos
> (redes corporativas e de universidade costumam bloquear isso — se travar,
> use o Wi-Fi de casa ou a função de roteador do próprio celular).

---

## 2. Backend

### 2.1 Clonar e instalar

```bash
git clone <url-do-repositorio-da-api>
cd TelemetriaSensores_API
npm install
```

### 2.2 Criar o arquivo de configuração

O arquivo `.env` não vai no Git, então precisa ser criado. Copie o exemplo:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Não precisa editar nada — os valores padrão já funcionam.

> **Já tinha um `.env` de antes?** Acrescente a linha `JWT_SECRET=...` (veja o
> `.env.example`). Sem ela a API não inicia, porque é usada para assinar os
> tokens de login.

### 2.3 Subir o banco de dados

Com o Docker Desktop **aberto**:

```bash
npm run db:up
```

Isso baixa e sobe um PostgreSQL. Confira se subiu:

```bash
docker ps
```

Deve aparecer `uvvgo-postgres` com status `Up ... (healthy)`.

### 2.4 Criar as tabelas e popular os dados

```bash
npm run db:migrate
npm run db:seed
```

O seed cadastra os **10 pontos de coleta do campus** e as conquistas.
Ao final você verá `Pronto. 10 pontos de interesse no banco.`

### 2.5 Iniciar a API

```bash
npm run dev
```

Deve aparecer:

```
-> Conectado ao banco de dados PostgreSQL (Prisma) com sucesso!
-> WebSocket Server ativo no path /ws
-> Servidor rodando na porta 3000 (0.0.0.0)
```

**Deixe este terminal aberto.** A API precisa continuar rodando.

### 2.6 Conferir se está funcionando

Abra no navegador do computador: **http://localhost:3000/api/pontos**

Deve retornar um JSON com `"total": 10`. Se aparecerem os 10 pontos, o backend está pronto.

A documentação dos endpoints fica em **http://localhost:3000/api-docs**.

---

## 3. App

### 3.1 Clonar e instalar

Em **outro terminal** (o da API continua rodando):

```bash
git clone <url-do-repositorio-do-app>
cd TelemetriaSensores
npm install
```

Não é preciso criar `.env` aqui — o app descobre o endereço da API sozinho.

### 3.2 Chave do Google Maps

Fora do Expo Go o mapa do Google exige uma chave própria (sem ela o mapa abre **cinza**).

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um projeto e ative
   a **Maps SDK for Android**
2. Em *Credenciais*, crie uma **chave de API**
3. Cole a chave em `app.json`, no lugar de `COLOQUE_SUA_CHAVE_DO_GOOGLE_MAPS_AQUI`

O uso no Maps SDK for Android é gratuito, mas o Google pede uma conta de faturamento no projeto.

### 3.3 Compilar e instalar no celular (só na primeira vez)

Conecte o celular no computador pelo **cabo USB** (aceite o aviso de depuração na tela
do celular) e rode:

```bash
npm run android
```

Isso compila o app com o ARCore e instala o **UVV Go** no celular. A primeira compilação
demora bastante (10–20 minutos); as seguintes são bem mais rápidas.

Só é preciso compilar de novo quando mudar uma dependência nativa ou o `app.json`.
Mudanças no código TypeScript aparecem na hora, sem recompilar.

### 3.4 Abrir no dia a dia

```bash
npm start
```

Abra o app **UVV Go** no celular (não o Expo Go) e escolha o servidor que aparece na lista,
ou escaneie o QR code do terminal. Quando o app pedir **permissão de localização**, toque
em **Permitir**. A permissão de **câmera** é pedida na primeira coleta em AR.

---

## 4. O que testar

O app abre na aba **Mapa**.

### Funciona corretamente se:

- O mapa carrega com o visual escuro
- Aparece o ponto azul da sua localização
- No topo aparecem suas coordenadas e a precisão (ex.: `-20.34105, -40.29230  ±12m`)
- Andando com o celular, o marcador se move e vai desenhando uma **linha azul** do trajeto
- O botão **Seguindo** mantém a câmera acompanhando você; arrastando o mapa ele desliga
- No rodapé aparece o **ponto mais próximo** e a distância, que muda conforme você anda
- A lista horizontal mostra os 10 pontos ordenados por distância; tocar em um leva a câmera até ele
- Na aba **Sensores**, o botão *Iniciar Coleta* começa a gravar e sincronizar a telemetria

### Coleta em realidade aumentada (no campus)

1. Entre no raio de um ponto: o círculo fica verde e aparece **📷 Abrir câmera AR**
2. Toque no botão e aponte a câmera para o chão, movendo o celular devagar
3. O **cristal dourado** aparece sobre o chão, girando (se o chão não for reconhecido
   em ~8 s, ele aparece flutuando à sua frente)
4. **Toque no cristal**: ele é coletado, aparecem os pontos ganhos e as conquistas
5. De volta ao mapa, o marcador do ponto fica dourado e a lista mostra ✓ — o mesmo
   ponto não rende pontos de novo

### Comportamentos normais (não são erros)

- **Os pontos estão longe de você.** As coordenadas apontam para o campus da UVV,
  em Vila Velha/ES. Testando em outro lugar, é preciso afastar o zoom para vê-los,
  e nenhum geofence vai disparar — o que está correto.
- **Os círculos não batem exatamente com os prédios.** As coordenadas do seed ainda
  são aproximadas, à espera da coleta em campo.
- **Demora alguns segundos para o GPS pegar**, principalmente dentro de prédios.
  Perto de uma janela ou ao ar livre é bem mais rápido.

---

## 5. Se der problema

### O mapa abre mas aparece uma faixa vermelha: "Não foi possível carregar os pontos"

O app não está alcançando a API. Verifique, em ordem:

1. O terminal da API ainda está rodando?
2. **http://localhost:3000/api/pontos** responde no navegador do computador?
3. O celular está na **mesma rede Wi-Fi** do computador?
4. O **firewall do Windows** pode estar bloqueando a porta 3000. Na primeira execução
   o Windows costuma perguntar — marque **Permitir acesso** para redes privadas.
   Se já negou antes: Firewall do Windows → Permitir um aplicativo → marque `Node.js`.

Toque na faixa vermelha para tentar de novo, sem reiniciar o app.

### `EADDRINUSE: address already in use :::3000`

Já existe algo usando a porta 3000 (provavelmente uma execução anterior da API).

```bash
# Windows — descobrir o PID e encerrar
netstat -ano | findstr :3000
taskkill /PID <numero-do-pid> /F
```

### `Can't reach database server` / erro do Prisma

O banco não está no ar. Abra o Docker Desktop e rode `npm run db:up` de novo.

### O mapa abre cinza, só com a logo do Google

Falta a chave do Google Maps (seção 3.2). Depois de colar a chave no `app.json`,
rode `npm run android` de novo — a chave entra na compilação.

### "AR indisponível neste aparelho"

O celular não está na [lista do ARCore](https://developers.google.com/ar/devices) ou falta
o app *Google Play Services para RA* — instale-o pela Play Store.

### O cristal não aparece na câmera

Ele vem da API (`http://<ip-do-computador>:3000/modelos/cristal.glb`). Confira se esse
endereço abre no navegador do celular. Se não abrir, é o mesmo problema de rede/firewall
da faixa vermelha (abaixo).

### `npm run android`: "SDK location not found" / "adb não encontrado"

O Android Studio não está instalado ou o SDK não foi baixado. Abra o Android Studio uma
vez, conclua o assistente inicial e tente de novo. Confira com `adb devices` se o celular
aparece como `device` (e não `unauthorized` — nesse caso aceite o aviso no celular).

### Quero recomeçar o banco do zero

```bash
npm run db:reset
npm run db:seed
```

### Ver o conteúdo do banco pelo navegador

```bash
npm run db:studio
```

---

## 6. Resumo rápido

Para quem já tem tudo instalado:

```bash
# Terminal 1 — backend
cd TelemetriaSensores_API
npm install && cp .env.example .env
npm run db:up && npm run db:migrate && npm run db:seed
npm run dev

# Terminal 2 — app
cd TelemetriaSensores
npm install
npm run android   # só na primeira vez (celular no USB) — compila e instala o UVV Go
npm start         # no dia a dia; abrir o app UVV Go no celular
```
