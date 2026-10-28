import { z } from 'zod';

const MSG_PONTO = 'Informe o `pontoId` numérico do ponto.';
const MSG_COORDENADAS = 'Informe `latitude` e `longitude` válidas.';

const coordenada = (limite: number) =>
  z
    .number({ error: MSG_COORDENADAS })
    .min(-limite, { error: MSG_COORDENADAS })
    .max(limite, { error: MSG_COORDENADAS });

/** Corpo de `POST /api/interacoes` — enviado ao tocar no objeto 3D em AR. */
export const registrarInteracaoSchema = z.object({
  pontoId: z.preprocess(Number, z.number({ error: MSG_PONTO }).int({ error: MSG_PONTO })),
  latitude: coordenada(90),
  longitude: coordenada(180),
  /** Precisão do GPS em metros (`coords.accuracy`). Opcional para apps antigos. */
  precisao: z.number({ error: '`precisao` deve ser numérica (metros).' }).min(0).nullish(),
  /** `true` quando o Android indica posição vinda de app de GPS falso (`location.mocked`). */
  mockado: z.boolean({ error: '`mockado` deve ser booleano.' }).nullish(),
});

export type RegistrarInteracaoDto = z.output<typeof registrarInteracaoSchema>;
