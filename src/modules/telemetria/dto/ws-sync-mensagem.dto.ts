import { z } from 'zod';
import { SyncLogDto } from './sync-log.dto';

/** Mensagem `sync` recebida pelo WebSocket (`ws://.../ws`). */
export const wsSyncMensagemSchema = z.object({
  type: z.literal('sync'),
  requestId: z.string().min(1),
  logs: z.array(z.record(z.string(), z.unknown()) as z.ZodType<SyncLogDto>),
  /** JWT opcional: associa os registros ao usuário autenticado. */
  token: z.string().optional(),
});

export type WsSyncMensagemDto = z.output<typeof wsSyncMensagemSchema>;

export type WsRespostaDto =
  | { type: 'sync_ack'; requestId: string; count: number }
  | { type: 'error'; requestId: string | null; message: string };
