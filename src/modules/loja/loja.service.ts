/**
 * Loja de itens cosméticos, comprados com os pontos do jogo.
 *
 * Comprar não tira pontos do ranking: a pontuação total continua a mesma e o gasto fica em
 * `pontosGastos`. O saldo para compras é a diferença entre os dois.
 */
import prisma from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import * as usuarioService from '../usuario/usuario.service';
import { CATALOGO, CategoriaItem, buscarItem } from './loja.catalogo';
import { LojaDto } from './dto/loja.dto';

/** Coluna do usuário que guarda o item equipado de cada categoria. */
const COLUNA: Record<CategoriaItem, 'molduraEquipada' | 'temaEquipado' | 'tituloEquipado' | 'rastroEquipado'> = {
  MOLDURA: 'molduraEquipada',
  TEMA: 'temaEquipado',
  TITULO: 'tituloEquipado',
  RASTRO: 'rastroEquipado',
};

export async function obter(usuarioId: number): Promise<LojaDto> {
  const [usuario, comprados] = await Promise.all([
    usuarioService.obterPorId(usuarioId),
    prisma.usuarioItem.findMany({ where: { usuarioId }, select: { itemCodigo: true } }),
  ]);
  const possui = new Set(comprados.map((c) => c.itemCodigo));
  const equipados = {
    MOLDURA: usuario.molduraEquipada,
    TEMA: usuario.temaEquipado,
    TITULO: usuario.tituloEquipado,
    RASTRO: usuario.rastroEquipado,
  };

  return {
    saldo: usuario.pontuacaoTotal - usuario.pontosGastos,
    pontuacaoTotal: usuario.pontuacaoTotal,
    pontosGastos: usuario.pontosGastos,
    equipados,
    itens: CATALOGO.map((item) => ({
      ...item,
      possui: possui.has(item.codigo),
      equipado: equipados[item.categoria] === item.codigo,
    })),
  };
}

/** Compra um item e já o equipa. 409 se já tiver; 422 se o saldo não der. */
export async function comprar(usuarioId: number, codigo: string): Promise<LojaDto> {
  const item = buscarItem(codigo);
  if (!item) throw new AppError(404, 'Item não encontrado na loja.');

  await prisma.$transaction(async (tx) => {
    // Dois toques em "Comprar" não podem gastar o saldo duas vezes.
    await usuarioService.travar(tx, usuarioId);
    const usuario = await usuarioService.obterPorId(usuarioId, tx);

    const jaTem = await tx.usuarioItem.findUnique({
      where: { usuarioId_itemCodigo: { usuarioId, itemCodigo: codigo } },
    });
    if (jaTem) throw new AppError(409, 'Você já tem este item.');

    const saldo = usuario.pontuacaoTotal - usuario.pontosGastos;
    if (saldo < item.preco) {
      throw new AppError(422, `Saldo insuficiente: o item custa ${item.preco} pontos e você tem ${saldo}.`, {
        saldo,
        preco: item.preco,
      });
    }

    await tx.usuarioItem.create({ data: { usuarioId, itemCodigo: codigo } });
    await tx.usuario.update({
      where: { id: usuarioId },
      data: { pontosGastos: { increment: item.preco }, [COLUNA[item.categoria]]: codigo },
    });
  });

  return obter(usuarioId);
}

/** Equipa um item comprado (ou volta ao padrão com `codigo` nulo). */
export async function equipar(usuarioId: number, categoria: CategoriaItem, codigo: string | null): Promise<LojaDto> {
  if (codigo !== null) {
    const item = buscarItem(codigo);
    if (!item) throw new AppError(404, 'Item não encontrado na loja.');
    if (item.categoria !== categoria) throw new AppError(400, 'O item não pertence a esta categoria.');
    const comprado = await prisma.usuarioItem.findUnique({
      where: { usuarioId_itemCodigo: { usuarioId, itemCodigo: codigo } },
    });
    if (!comprado) throw new AppError(403, 'Compre o item antes de equipá-lo.');
  }

  await usuarioService.obterPorId(usuarioId);
  await prisma.usuario.update({ where: { id: usuarioId }, data: { [COLUNA[categoria]]: codigo } });
  return obter(usuarioId);
}
