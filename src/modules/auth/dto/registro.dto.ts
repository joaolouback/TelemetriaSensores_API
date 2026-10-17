import { z } from 'zod';

const SENHA_MIN = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MSG_NOME = 'Informe o nome (mínimo 2 caracteres).';
const MSG_EMAIL = 'E-mail inválido.';
const MSG_SENHA = `A senha deve ter pelo menos ${SENHA_MIN} caracteres.`;

/** Corpo de `POST /api/auth/registro`. */
export const registroSchema = z.object({
  nome: z.string({ error: MSG_NOME }).trim().min(2, { error: MSG_NOME }),
  email: z.string({ error: MSG_EMAIL }).trim().toLowerCase().regex(EMAIL_REGEX, { error: MSG_EMAIL }),
  senha: z.string({ error: MSG_SENHA }).min(SENHA_MIN, { error: MSG_SENHA }),
});

export type RegistroDto = z.output<typeof registroSchema>;
