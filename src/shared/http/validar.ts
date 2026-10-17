import { z } from 'zod';
import { AppError } from '../errors/app-error';

/**
 * Valida `dados` com o schema do DTO. Em caso de erro lança `AppError(400)`
 * com a mensagem do primeiro campo inválido (as mensagens ficam nos schemas).
 */
export function validar<T extends z.ZodType>(schema: T, dados: unknown): z.output<T> {
  const resultado = schema.safeParse(dados);
  if (!resultado.success) {
    throw new AppError(400, resultado.error.issues[0]?.message ?? 'Dados inválidos.');
  }
  return resultado.data;
}
