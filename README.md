# Sensor Telemetry API 🚀

Uma API REST completa desenvolvida em Node.js usando Express, TypeScript, e MySQL. Feita sob medida para receber dados de telemetria de um aplicativo mobile off-line first realizando `bulk insert` (inserção em lote).

## 🛠️ Tecnologias Utilizadas
- **Node.js + Express** (Servidor HTTP)
- **TypeScript** (Tipagem forte)
- **MySQL2** (Driver super rápido p/ Banco de Dados usando Promises)
- **Dotenv** (Gerenciamento de variáveis)
- **CORS** 

## ⚙️ Pré-requisitos
- **Node.js** v16 ou superior
- **MySQL** configurado localmente ou em servidor e rodando

## 🚀 Como Rodar Localmente

1. **Instale as dependências**
   Abra seu terminal na pasta raiz e rode:
   ```bash
   npm install
   ```

2. **Configure as Variáveis de Ambiente**
   O arquivo `.env` já foi criado na raiz da aplicação. Verifique se as credenciais do seu banco MySQL (usamos root sem senha por padrão) correspondem à sua máquina:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=sua_senha_aqui se tiver
   DB_NAME=app01
   ```

3. **Crie a Tabela no Banco de Dados**
   Acesse seu MySQL, crie o banco de dados `app01` caso não exista, e rode o script SQL a seguir:
   ```sql
   CREATE DATABASE IF NOT EXISTS app01;
   USE app01;
   
   CREATE TABLE sensor_logs (
     id INT AUTO_INCREMENT PRIMARY KEY,
     sensor_type TEXT,
     latitude REAL,
     longitude REAL,
     accel_x REAL,
     accel_y REAL,
     accel_z REAL,
     magnitude REAL,
     battery_level REAL,
     network_type TEXT,
     synced INTEGER,
     created_at TEXT
   );
   ```

4. **Inicie o Servidor**
   Use o comando abaixo para iniciar o modo de desenvolvimento usando auto-reload com o `tsx`:
   ```bash
   npm run dev
   ```
   *Você deverá ver "✅ Conectado ao banco de dados..." no seu terminal.*

## 📌 Testando os Endpoints

### 1. Sincronizar Logs (POST `/api/sync`)
Envia os objetos gerados e armazenados localmente no SQLite caso o app estivesse offline.

**Request:**
```http
POST http://localhost:3000/api/sync
Content-Type: application/json

[
  {
    "sensor_type": "GPS",
    "latitude": -22.9068,
    "longitude": -43.1729,
    "accel_x": 0.0,
    "accel_y": 0.0,
    "accel_z": 0.0,
    "magnitude": 0.0,
    "battery_level": 80.5,
    "network_type": "WIFI",
    "synced": 1,
    "created_at": "2023-11-20T12:00:00Z"
  }
]
```

**Response (200 OK):**
```json
{
  "message": "Sincronização realizada com sucesso",
  "insertedCount": 1
}
```

### 2. Verificar Logs (GET `/api/logs`)
Endpoint para consulta com suporte a paginação para checagem rápida no navegador/Postman.

**Request:**
```http
GET http://localhost:3000/api/logs?page=1&limit=5
```
