/**
 * Gateway WebSocket da telemetria (`ws://.../ws`).
 * Processa mensagens de sync com o mesmo service e mapper do REST.
 */
import WebSocket from 'ws';
import { verificarToken } from '../../shared/utils/jwt';
import * as telemetriaService from './telemetria.service';
import { wsSyncMensagemSchema, WsRespostaDto } from './dto/ws-sync-mensagem.dto';

const enviar = (ws: WebSocket, resposta: WsRespostaDto) => ws.send(JSON.stringify(resposta));

/** Lê o `requestId` mesmo de mensagens inválidas, para o cliente casar o erro com o pedido. */
const extrairRequestId = (dados: unknown): string | null => {
  const id = (dados as { requestId?: unknown } | null)?.requestId;
  return typeof id === 'string' && id ? id : null;
};

export const setupWebSocket = (wss: WebSocket.Server): void => {
  wss.on('connection', (ws: WebSocket) => {
    console.log(`[WS] Cliente conectado. Total de conexões: ${wss.clients.size}`);

    ws.on('message', async (raw: WebSocket.RawData) => {
      let requestId: string | null = null;

      try {
        const dados: unknown = JSON.parse(raw.toString());
        requestId = extrairRequestId(dados);

        const mensagem = wsSyncMensagemSchema.safeParse(dados);
        if (!mensagem.success) {
          return enviar(ws, {
            type: 'error',
            requestId,
            message: 'Mensagem inválida. Esperado: { type: "sync", requestId: string, logs: array }',
          });
        }

        const { logs, token } = mensagem.data;
        if (logs.length === 0) {
          return enviar(ws, { type: 'error', requestId, message: 'O array de logs não pode ser vazio.' });
        }

        console.log(`[WS] Recebido sync requestId=${requestId} com ${logs.length} logs`);

        const count = await telemetriaService.sincronizar(logs, verificarToken(token));

        console.log(`[WS] Inseridos ${count} logs para requestId=${requestId}`);
        enviar(ws, { type: 'sync_ack', requestId: mensagem.data.requestId, count });
      } catch (error) {
        console.error(`[WS] Erro ao processar mensagem:`, error);
        enviar(ws, {
          type: 'error',
          requestId,
          message: error instanceof Error ? error.message : 'Erro interno ao processar mensagem.',
        });
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
