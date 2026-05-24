import WebSocket from 'ws';
import pool from '../database/db';
import { parseLogs } from '../utils/parseLogs';

interface SyncMessage {
  type: 'sync';
  requestId: string;
  logs: any[];
}

/**
 * Configura os handlers de conexão do WebSocket Server.
 * Processa mensagens de sync usando a mesma lógica de parsing do REST.
 */
export const setupWebSocket = (wss: WebSocket.Server): void => {
  wss.on('connection', (ws: WebSocket) => {
    console.log(`[WS] Cliente conectado. Total de conexões: ${wss.clients.size}`);

    ws.on('message', async (raw: WebSocket.RawData) => {
      let requestId: string | undefined;

      try {
        const data: SyncMessage = JSON.parse(raw.toString());
        requestId = data.requestId;

        if (data.type !== 'sync' || !data.requestId || !Array.isArray(data.logs)) {
          ws.send(JSON.stringify({
            type: 'error',
            requestId: data.requestId || null,
            message: 'Mensagem inválida. Esperado: { type: "sync", requestId: string, logs: array }'
          }));
          return;
        }

        if (data.logs.length === 0) {
          ws.send(JSON.stringify({
            type: 'error',
            requestId,
            message: 'O array de logs não pode ser vazio.'
          }));
          return;
        }

        console.log(`[WS] Recebido sync requestId=${requestId} com ${data.logs.length} logs`);

        const values = parseLogs(data.logs);

        const query = `
          INSERT INTO sensor_logs 
          (sensor_type, latitude, longitude, accel_x, accel_y, accel_z, magnitude, battery_level, network_type, synced, created_at) 
          VALUES ?
        `;

        const [result] = await pool.query(query, [values]);
        const count = (result as any).affectedRows;

        console.log(`[WS] Inseridos ${count} logs para requestId=${requestId}`);

        ws.send(JSON.stringify({
          type: 'sync_ack',
          requestId,
          count
        }));
      } catch (error) {
        console.error(`[WS] Erro ao processar mensagem:`, error);
        ws.send(JSON.stringify({
          type: 'error',
          requestId: requestId || null,
          message: error instanceof Error ? error.message : 'Erro interno ao processar mensagem.'
        }));
      }
    });

    ws.on('close', () => {
      console.log(`[WS] Cliente desconectado. Total de conexões: ${wss.clients.size}`);
    });

    ws.on('error', (err: Error) => {
      console.error(`[WS] Erro na conexão:`, err.message);
    });
  });
};
