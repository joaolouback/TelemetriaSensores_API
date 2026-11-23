import { Response } from 'express';
import { validar } from '../../shared/http/validar';
import { AuthenticatedRequest } from '../../shared/middlewares/auth.middleware';
import * as lojaService from './loja.service';
import { codigoItemSchema, equiparSchema } from './dto/loja.dto';

/** GET /api/loja — catálogo, saldo e itens comprados/equipados. */
export const obterLoja = async (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json(await lojaService.obter(req.usuarioId));
};

/** POST /api/loja/itens/:codigo/compra — compra e equipa o item. */
export const comprarItem = async (req: AuthenticatedRequest, res: Response) => {
  const { codigo } = validar(codigoItemSchema, req.params);
  res.status(201).json(await lojaService.comprar(req.usuarioId, codigo));
};

/** PUT /api/loja/equipados — troca (ou tira) o item equipado de uma categoria. */
export const equiparItem = async (req: AuthenticatedRequest, res: Response) => {
  const { categoria, codigo } = validar(equiparSchema, req.body);
  res.status(200).json(await lojaService.equipar(req.usuarioId, categoria, codigo));
};
