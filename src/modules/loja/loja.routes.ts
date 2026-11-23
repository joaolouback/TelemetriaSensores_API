import { Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler';
import { autenticar } from '../../shared/middlewares/auth.middleware';
import { comprarItem, equiparItem, obterLoja } from './loja.controller';

const router = Router();

/**
 * @swagger
 * /api/loja:
 *   get:
 *     summary: Loja de itens
 *     description: Catálogo (molduras, temas, títulos e rastros), saldo para compras e itens comprados/equipados. O saldo é a pontuação total menos os pontos já gastos; comprar não muda a posição no ranking.
 *     responses:
 *       200:
 *         description: "`{ saldo, pontuacaoTotal, pontosGastos, equipados, itens }`"
 *       401:
 *         description: Token ausente ou inválido
 */
router.get('/loja', autenticar, asyncHandler(obterLoja));

/**
 * @swagger
 * /api/loja/itens/{codigo}/compra:
 *   post:
 *     summary: Compra um item
 *     description: Desconta o preço do saldo e já equipa o item. A compra é feita numa transação com a linha do usuário travada.
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *           example: moldura-ouro
 *     responses:
 *       201:
 *         description: Estado da loja atualizado
 *       401:
 *         description: Token ausente ou inválido
 *       404:
 *         description: Item inexistente
 *       409:
 *         description: O jogador já tem o item
 *       422:
 *         description: Saldo insuficiente
 */
router.post('/loja/itens/:codigo/compra', autenticar, asyncHandler(comprarItem));

/**
 * @swagger
 * /api/loja/equipados:
 *   put:
 *     summary: Equipa ou tira um item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoria, codigo]
 *             properties:
 *               categoria:
 *                 type: string
 *                 enum: [MOLDURA, TEMA, TITULO, RASTRO]
 *               codigo:
 *                 type: string
 *                 nullable: true
 *                 description: Código do item; nulo volta ao padrão
 *     responses:
 *       200:
 *         description: Estado da loja atualizado
 *       400:
 *         description: Categoria inválida ou item de outra categoria
 *       403:
 *         description: Item não comprado
 *       404:
 *         description: Item inexistente
 */
router.put('/loja/equipados', autenticar, asyncHandler(equiparItem));

export default router;
