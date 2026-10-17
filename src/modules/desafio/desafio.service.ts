/**
 * Desafio 1x1: um jogador cria o desafio e recebe um código; o oponente entra
 * com o código e o relógio começa. São sorteados pontos do campus e vence
 * quem coletar todos primeiro. Se o tempo acabar, vence quem coletou mais.
 *
 * Não há tarefa agendada: desafios vencidos (convite ou partida) são encerrados
 * na próxima vez que alguém consulta ou age sobre eles. Toda mudança de estado
 * trava a linha do desafio, então dois jogadores completando ao mesmo tempo,
 * ou entrando com o mesmo código, não geram resultado duplicado.
 */
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma, { DbClient } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import * as usuarioService from '../usuario/usuario.service';
import * as conquistaService from '../conquista/conquista.service';
import { Conquista } from '../conquista/entities/conquista.entity';
import { DesafioCompleto, StatusDesafio, incluirDesafioCompleto } from './entities/desafio.entity';
import { ColetaDesafioDto } from './dto/desafio.dto';

export const PONTOS_POR_DESAFIO = 3;
export const DURACAO_PARTIDA_MS = 60 * 60 * 1000;
export const VALIDADE_CONVITE_MS = 30 * 60 * 1000;
export const BONUS_VITORIA = 20;
/** Depois de terminar, o desafio ainda aparece em `atual` para os dois verem o resultado. */
const EXIBIR_RESULTADO_MS = 30 * 60 * 1000;

/** Sem 0/O e 1/I, que se confundem ao ditar ou digitar o código. */
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const ATIVOS: StatusDesafio[] = ['AGUARDANDO', 'EM_ANDAMENTO'];

const gerarCodigo = (): string =>
  Array.from({ length: 6 }, () => ALFABETO_CODIGO[crypto.randomInt(ALFABETO_CODIGO.length)]).join('');

const participante = (usuarioId: number) => ({
  OR: [{ desafianteId: usuarioId }, { desafiadoId: usuarioId }],
});

/** Trava a linha do desafio até o fim da transação. */
async function travar(tx: DbClient, desafioId: number): Promise<void> {
  await tx.$queryRaw`SELECT id FROM desafio WHERE id = ${desafioId} FOR UPDATE`;
}

const carregar = (tx: DbClient, desafioId: number): Promise<DesafioCompleto> =>
  tx.desafio.findUniqueOrThrow({ where: { id: desafioId }, include: incluirDesafioCompleto });

/**
 * Encerra o desafio. O vencedor (se houver) ganha o bônus e pode desbloquear conquistas.
 * Precisa ser chamado com a linha do desafio travada.
 */
async function finalizar(
  tx: DbClient,
  desafioId: number,
  vencedorId: number | null
): Promise<Conquista[]> {
  await tx.desafio.update({
    where: { id: desafioId },
    data: { status: 'FINALIZADO', vencedorId, finalizadoEm: new Date() },
  });
  if (vencedorId === null) return [];

  const vencedor = await usuarioService.adicionarPontos(tx, vencedorId, BONUS_VITORIA);
  console.log(`[DESAFIO] #${desafioId} vencido por usuario=${vencedorId} (+${BONUS_VITORIA})`);
  return conquistaService.desbloquearPorPontuacao(tx, vencedorId, vencedor.pontuacaoTotal);
}

/** Tempo esgotado: vence quem coletou mais; com o mesmo número, empate. */
async function finalizarPorTempo(tx: DbClient, desafio: DesafioCompleto): Promise<void> {
  const contar = (id: number | null) => desafio.coletas.filter((c) => c.usuarioId === id).length;
  const a = contar(desafio.desafianteId);
  const b = contar(desafio.desafiadoId);
  const vencedor = a === b ? null : a > b ? desafio.desafianteId : desafio.desafiadoId;
  console.log(`[DESAFIO] #${desafio.id} terminou por tempo (${a} x ${b})`);
  await finalizar(tx, desafio.id, vencedor);
}

/**
 * Aplica o que venceu desde a última consulta (convite expirado, tempo esgotado).
 * Precisa ser chamado com a linha travada. Retorna o desafio atualizado.
 */
async function encerrarSeVencido(tx: DbClient, desafio: DesafioCompleto): Promise<DesafioCompleto> {
  const agora = Date.now();

  if (desafio.status === 'AGUARDANDO' && desafio.criadoEm.getTime() + VALIDADE_CONVITE_MS < agora) {
    await tx.desafio.update({ where: { id: desafio.id }, data: { status: 'EXPIRADO' } });
    return carregar(tx, desafio.id);
  }
  if (desafio.status === 'EM_ANDAMENTO' && desafio.terminaEm && desafio.terminaEm.getTime() <= agora) {
    await finalizarPorTempo(tx, desafio);
    return carregar(tx, desafio.id);
  }
  return desafio;
}

/** Desafio aguardando ou em andamento do usuário, já com os vencidos encerrados. */
async function ativoDoUsuario(tx: DbClient, usuarioId: number): Promise<DesafioCompleto | null> {
  const candidato = await tx.desafio.findFirst({
    where: { status: { in: ATIVOS }, ...participante(usuarioId) },
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  if (!candidato) return null;

  await travar(tx, candidato.id);
  const desafio = await encerrarSeVencido(tx, await carregar(tx, candidato.id));
  return ATIVOS.includes(desafio.status) ? desafio : null;
}

/** Sorteia pontos ativos distintos (embaralhamento de Fisher–Yates com aleatoriedade criptográfica). */
async function sortearPontos(tx: DbClient): Promise<number[]> {
  const ids = (await tx.pontoDeInteresse.findMany({ where: { ativo: true }, select: { id: true } })).map(
    (p) => p.id
  );
  if (ids.length < PONTOS_POR_DESAFIO) {
    throw new AppError(409, 'O campus ainda não tem pontos suficientes para um desafio.');
  }
  for (let i = ids.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, PONTOS_POR_DESAFIO);
}

const erroJaEmDesafio = () =>
  new AppError(409, 'Você já está em um desafio. Termine ou saia dele antes de começar outro.');

/** Cria o desafio e sorteia os pontos. O código é o convite para o oponente. */
export async function criar(usuarioId: number): Promise<DesafioCompleto> {
  for (let tentativa = 0; ; tentativa++) {
    try {
      return await prisma.$transaction(async (tx) => {
        await usuarioService.travar(tx, usuarioId);
        if (await ativoDoUsuario(tx, usuarioId)) throw erroJaEmDesafio();

        const pontos = await sortearPontos(tx);
        const desafio = await tx.desafio.create({
          data: {
            codigo: gerarCodigo(),
            desafianteId: usuarioId,
            pontos: { create: pontos.map((pontoDeInteresseId, ordem) => ({ pontoDeInteresseId, ordem })) },
          },
          include: incluirDesafioCompleto,
        });
        console.log(`[DESAFIO] #${desafio.id} criado por usuario=${usuarioId} (código ${desafio.codigo})`);
        return desafio;
      });
    } catch (erro) {
      // Código sorteado já existe (raríssimo com 32^6 combinações): tenta outro.
      const codigoRepetido =
        erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002';
      if (!codigoRepetido || tentativa >= 4) throw erro;
    }
  }
}

/** Entra no desafio pelo código. O relógio da partida começa agora. */
export async function entrar(usuarioId: number, codigo: string): Promise<DesafioCompleto> {
  return prisma.$transaction(async (tx) => {
    await usuarioService.travar(tx, usuarioId);

    const encontrado = await tx.desafio.findUnique({ where: { codigo }, select: { id: true } });
    if (!encontrado) throw new AppError(404, 'Código inválido. Confira com quem te desafiou.');

    await travar(tx, encontrado.id);
    const desafio = await encerrarSeVencido(tx, await carregar(tx, encontrado.id));

    if (desafio.desafianteId === usuarioId) {
      throw new AppError(409, 'Este é o seu próprio desafio. Mande o código para outro jogador.');
    }
    if (desafio.status === 'EXPIRADO') {
      throw new AppError(410, 'Este convite expirou. Peça um código novo.');
    }
    if (desafio.status !== 'AGUARDANDO') {
      throw new AppError(409, 'Este desafio não está mais aceitando jogadores.');
    }
    if (await ativoDoUsuario(tx, usuarioId)) throw erroJaEmDesafio();

    const inicio = new Date();
    await tx.desafio.update({
      where: { id: desafio.id },
      data: {
        desafiadoId: usuarioId,
        status: 'EM_ANDAMENTO',
        iniciadoEm: inicio,
        terminaEm: new Date(inicio.getTime() + DURACAO_PARTIDA_MS),
      },
    });
    console.log(`[DESAFIO] #${desafio.id} começou: usuario=${desafio.desafianteId} x usuario=${usuarioId}`);
    return carregar(tx, desafio.id);
  });
}

/**
 * Desafio para a tela do app: o ativo, ou o último que terminou há pouco
 * (para os dois verem o resultado). Null se não houver nenhum.
 */
export async function atual(usuarioId: number): Promise<DesafioCompleto | null> {
  return prisma.$transaction(async (tx) => {
    const ativo = await ativoDoUsuario(tx, usuarioId);
    if (ativo) return ativo;

    return tx.desafio.findFirst({
      where: {
        status: 'FINALIZADO',
        finalizadoEm: { gte: new Date(Date.now() - EXIBIR_RESULTADO_MS) },
        ...participante(usuarioId),
      },
      orderBy: { finalizadoEm: 'desc' },
      include: incluirDesafioCompleto,
    });
  });
}

/**
 * Sair do desafio: antes de o oponente entrar, cancela; durante a partida,
 * é desistência — o oponente vence e leva o bônus.
 */
export async function sair(usuarioId: number, desafioId: number): Promise<DesafioCompleto> {
  return prisma.$transaction(async (tx) => {
    const existe = await tx.desafio.findFirst({
      where: { id: desafioId, ...participante(usuarioId) },
      select: { id: true },
    });
    if (!existe) throw new AppError(404, `Desafio ${desafioId} não encontrado.`);

    await travar(tx, desafioId);
    const desafio = await encerrarSeVencido(tx, await carregar(tx, desafioId));

    if (desafio.status === 'AGUARDANDO') {
      await tx.desafio.update({ where: { id: desafioId }, data: { status: 'CANCELADO' } });
      console.log(`[DESAFIO] #${desafioId} cancelado pelo criador`);
    } else if (desafio.status === 'EM_ANDAMENTO') {
      const oponente = desafio.desafianteId === usuarioId ? desafio.desafiadoId : desafio.desafianteId;
      console.log(`[DESAFIO] #${desafioId}: usuario=${usuarioId} desistiu`);
      await finalizar(tx, desafioId, oponente);
    } else {
      throw new AppError(409, 'Este desafio já terminou.');
    }
    return carregar(tx, desafioId);
  });
}

/** Últimos desafios terminados e o placar geral de vitórias, derrotas e empates. */
export async function historico(usuarioId: number): Promise<DesafioCompleto[]> {
  return prisma.desafio.findMany({
    where: { status: 'FINALIZADO', ...participante(usuarioId) },
    orderBy: { finalizadoEm: 'desc' },
    take: 20,
    include: incluirDesafioCompleto,
  });
}

export async function placar(usuarioId: number) {
  const [vitorias, total, empates] = await Promise.all([
    prisma.desafio.count({ where: { status: 'FINALIZADO', vencedorId: usuarioId } }),
    prisma.desafio.count({ where: { status: 'FINALIZADO', ...participante(usuarioId) } }),
    prisma.desafio.count({ where: { status: 'FINALIZADO', vencedorId: null, ...participante(usuarioId) } }),
  ]);
  return { vitorias, derrotas: total - vitorias - empates, empates };
}

// ─── Integração com o check-in (módulo interacao) ───────────────────

/** O ponto faz parte do desafio em andamento do usuário e ele ainda não o coletou? */
export async function pontoPendente(tx: DbClient, usuarioId: number, pontoId: number): Promise<boolean> {
  const pendente = await tx.desafio.findFirst({
    where: {
      status: 'EM_ANDAMENTO',
      terminaEm: { gt: new Date() },
      ...participante(usuarioId),
      pontos: { some: { pontoDeInteresseId: pontoId } },
      coletas: { none: { usuarioId, pontoDeInteresseId: pontoId } },
    },
    select: { id: true },
  });
  return pendente !== null;
}

/**
 * Registra a coleta do ponto no desafio em andamento (chamado dentro da
 * transação do check-in, depois de validado o geofence). Se for o último
 * ponto, o usuário vence. Retorna null se o ponto não conta para nenhum desafio.
 */
export async function registrarColeta(
  tx: DbClient,
  usuarioId: number,
  pontoId: number
): Promise<{ coleta: ColetaDesafioDto; novasConquistas: Conquista[] } | null> {
  const desafio = await ativoDoUsuario(tx, usuarioId);
  if (!desafio || desafio.status !== 'EM_ANDAMENTO') return null;
  if (!desafio.pontos.some((p) => p.pontoDeInteresseId === pontoId)) return null;
  if (desafio.coletas.some((c) => c.usuarioId === usuarioId && c.pontoDeInteresseId === pontoId)) return null;

  await tx.desafioColeta.create({ data: { desafioId: desafio.id, usuarioId, pontoDeInteresseId: pontoId } });

  const coletados = desafio.coletas.filter((c) => c.usuarioId === usuarioId).length + 1;
  const total = desafio.pontos.length;
  const venceu = coletados === total;
  const novasConquistas = venceu ? await finalizar(tx, desafio.id, usuarioId) : [];

  console.log(`[DESAFIO] #${desafio.id}: usuario=${usuarioId} coletou ${coletados}/${total}`);

  return {
    coleta: {
      desafioId: desafio.id,
      coletados,
      total,
      finalizado: venceu,
      resultado: venceu ? 'vitoria' : null,
      bonus: venceu ? BONUS_VITORIA : 0,
    },
    novasConquistas,
  };
}
