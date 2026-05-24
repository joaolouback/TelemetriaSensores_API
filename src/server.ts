import http from 'http';
import { WebSocketServer } from 'ws';
import app from './app';
import dotenv from 'dotenv';
import pool from './database/db';
import { setupWebSocket } from './controllers/wsHandler';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Validando a conexão com o banco antes de escutar a porta
    const connection = await pool.getConnection();
    console.log('-> Conectado ao banco de dados MySQL com sucesso!');
    connection.release();

    // Cria servidor HTTP a partir do app Express
    const server = http.createServer(app);

    // Instancia WebSocket Server no path /ws (mesma porta)
    const wss = new WebSocketServer({ server, path: '/ws' });
    setupWebSocket(wss);
    console.log('-> WebSocket Server ativo no path /ws');

    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`-> Servidor rodando na porta ${PORT} (0.0.0.0)`);
    });
  } catch (error) {
    console.error('Xxxxx Erro crítico: Falha ao conectar ao banco de dados. xxxxX', error);
    process.exit(1);
  }
};

startServer();
