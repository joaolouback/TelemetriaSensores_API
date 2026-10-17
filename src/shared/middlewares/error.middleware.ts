/**
 * Tratamento central de erros do Express. Precisa ser registrado por último em `app.ts`.
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';

export const errorMiddleware = (
  erro: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (erro instanceof AppError) {
    res.status(erro.status).json({ error: erro.message, ...erro.detalhes });
    return;
  }

  // Erros do express.json(): JSON malformado, corpo grande demais etc.
  const tipo = (erro as { type?: string } | null)?.type;
  if (tipo === 'entity.parse.failed') {
    res.status(400).json({ error: 'Corpo da requisição não é um JSON válido.' });
    return;
  }
  if (tipo === 'entity.too.large') {
    res.status(413).json({ error: 'Requisição grande demais. Envie os registros em lotes menores.' });
    return;
  }
  const status = (erro as { status?: number } | null)?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ error: 'Requisição inválida.' });
    return;
  }

  console.error(`Erro não tratado em ${req.method} ${req.originalUrl}:`, erro);
  res.status(500).json({ error: 'Erro interno no servidor.' });
};
