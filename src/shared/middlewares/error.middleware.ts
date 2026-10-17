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

  // JSON malformado no corpo da requisição (lançado pelo express.json()).
  if (erro instanceof SyntaxError && 'body' in erro) {
    res.status(400).json({ error: 'Corpo da requisição não é um JSON válido.' });
    return;
  }

  console.error(`Erro não tratado em ${req.method} ${req.originalUrl}:`, erro);
  res.status(500).json({ error: 'Erro interno no servidor.' });
};
