/**
 * Erro de negócio com status HTTP.
 *
 * Os services lançam `AppError` (ex.: `new AppError(409, 'Já existe...')`) e o
 * `errorMiddleware` converte em resposta `{ error, ...detalhes }`. Assim os
 * controllers não precisam de try/catch nem decidir status.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Campos extras devolvidos junto com `error` (ex.: `distanciaMetros`). */
    public readonly detalhes?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}
