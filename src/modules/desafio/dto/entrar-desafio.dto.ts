import { z } from 'zod';

const MSG = 'Informe o código de 6 caracteres do desafio.';

/** Corpo de `POST /api/desafios/entrar`. Aceita minúsculas e espaços em volta. */
export const entrarDesafioSchema = z.object({
  codigo: z
    .string({ error: MSG })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/, { error: MSG }),
});

export type EntrarDesafioDto = z.output<typeof entrarDesafioSchema>;
