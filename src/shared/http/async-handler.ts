import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Encaminha para o `errorMiddleware` os erros lançados por handlers assíncronos.
 * O Express 4 não faz isso sozinho com Promises rejeitadas.
 */
export const asyncHandler =
  <Req extends Request = Request>(
    handler: (req: Req, res: Response, next: NextFunction) => Promise<unknown>
  ): RequestHandler =>
  (req, res, next) => {
    handler(req as Req, res, next).catch(next);
  };
