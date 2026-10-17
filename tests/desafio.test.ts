import { describe, it, expect, afterAll } from 'vitest';
import prisma from '../src/shared/database/prisma';
import { api, criarConta, listarPontos, coletar, pontuacao, PontoTeste } from './helpers';

type Conta = Awaited<ReturnType<typeof criarConta>>;

const auth = (c: Conta) => ({ Authorization: `Bearer ${c.token}` });
const criar = (c: Conta) => api().post('/api/desafios').set(auth(c));
const entrar = (c: Conta, codigo: string) => api().post('/api/desafios/entrar').set(auth(c)).send({ codigo });
const atual = async (c: Conta) => (await api().get('/api/desafios/atual').set(auth(c))).body.desafio;
const sair = (c: Conta, id: number) => api().post(`/api/desafios/${id}/sair`).set(auth(c));

async function pontosDoDesafio(ids: { id: number }[]): Promise<PontoTeste[]> {
  const todos = await listarPontos();
  return ids.map(({ id }) => todos.find((p) => p.id === id)!);
}

/** Dois jogadores numa partida em andamento. */
async function partida() {
  const [a, b] = [await criarConta('Ana'), await criarConta('Bruno')];
  const desafio = (await criar(a)).body;
  await entrar(b, desafio.codigo);
  return { a, b, desafio, pontos: await pontosDoDesafio(desafio.pontos) };
}

afterAll(() => prisma.$disconnect());

describe('desafio 1x1', () => {
  it('cria com código de 6 caracteres, 3 pontos distintos e convite de 30 min', async () => {
    const a = await criarConta();
    const res = await criar(a);
    expect(res.status).toBe(201);
    expect(res.body.codigo).toMatch(/^[A-Z2-9]{6}$/);
    expect(res.body.status).toBe('AGUARDANDO');
    expect(new Set(res.body.pontos.map((p: { id: number }) => p.id)).size).toBe(3);
    const minutos = (new Date(res.body.conviteExpiraEm).getTime() - new Date(res.body.criadoEm).getTime()) / 60_000;
    expect(minutos).toBe(30);

    expect((await criar(a)).status).toBe(409);
    expect((await entrar(a, res.body.codigo)).status).toBe(409);
  });

  it('valida o código', async () => {
    const b = await criarConta();
    expect((await entrar(b, 'abc')).status).toBe(400);
    expect((await entrar(b, 'ZZZZZZ')).status).toBe(404);
  });

  it('entrar aceita minúsculas, começa a partida de 1 hora e fecha para terceiros', async () => {
    const [a, b, c] = [await criarConta(), await criarConta(), await criarConta()];
    const { codigo } = (await criar(a)).body;
    const res = await entrar(b, `  ${codigo.toLowerCase()} `);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'EM_ANDAMENTO', papel: 'desafiado' });
    const minutos = (new Date(res.body.terminaEm).getTime() - new Date(res.body.iniciadoEm).getTime()) / 60_000;
    expect(minutos).toBe(60);
    expect((await entrar(c, codigo)).status).toBe(409);
    expect((await atual(a)).oponente.id).toBe(b.id);
  });

  it('ponto já coletado conta no desafio, sem repetir os pontos normais', async () => {
    const a = await criarConta();
    const desafio = (await criar(a)).body;
    const [p0] = await pontosDoDesafio(desafio.pontos);
    const antes = await coletar(a.token, p0); // desafio ainda aguardando: coleta normal
    expect(antes.body.desafio).toBeNull();

    await entrar(await criarConta(), desafio.codigo);
    const noDesafio = await coletar(a.token, p0);
    expect(noDesafio.status).toBe(201);
    expect(noDesafio.body).toMatchObject({ pontosGanhos: 0, interacao: null });
    expect(noDesafio.body.desafio.coletados).toBe(1);
    expect((await coletar(a.token, p0)).status).toBe(409);
  });

  it('quem completa primeiro vence e ganha +20; o outro vê a derrota', async () => {
    const { a, b, pontos } = await partida();
    const antes = await pontuacao(a.token);
    for (const p of pontos.slice(0, 2)) await coletar(a.token, p);
    const ultimo = await coletar(a.token, pontos[2]);
    expect(ultimo.body.desafio).toMatchObject({ finalizado: true, resultado: 'vitoria', bonus: 20 });
    const normais = pontos.reduce((s, p) => s + p.pontosRecompensa, 0);
    expect((await pontuacao(a.token)) - antes).toBe(normais + 20);
    expect((await atual(b)).resultado).toBe('derrota');

    const hist = (await api().get('/api/desafios/historico').set(auth(a))).body;
    expect(hist).toMatchObject({ vitorias: 1, derrotas: 0, empates: 0 });
  });

  it('se os dois completam ao mesmo tempo, só um vence', async () => {
    const { a, b, desafio, pontos } = await partida();
    for (const j of [a, b]) for (const p of pontos.slice(0, 2)) await coletar(j.token, p);
    const respostas = await Promise.all([coletar(a.token, pontos[2]), coletar(b.token, pontos[2])]);
    expect(respostas.filter((r) => r.body.desafio?.resultado === 'vitoria')).toHaveLength(1);
    const vencedores = await prisma.desafio.count({ where: { id: desafio.id, NOT: { vencedorId: null } } });
    expect(vencedores).toBe(1);
  });

  it('desistir dá a vitória e o bônus ao oponente', async () => {
    const { a, b, desafio } = await partida();
    const antes = await pontuacao(b.token);
    const res = await sair(a, desafio.id);
    expect(res.body.resultado).toBe('derrota');
    expect((await pontuacao(b.token)) - antes).toBe(20);
    expect((await sair(a, desafio.id)).status).toBe(409);
    expect((await sair(await criarConta(), desafio.id)).status).toBe(404);
  });

  it('cancelar antes de começar some do desafio atual', async () => {
    const a = await criarConta();
    const { id } = (await criar(a)).body;
    expect((await sair(a, id)).body.status).toBe('CANCELADO');
    expect(await atual(a)).toBeNull();
  });

  it('convite com mais de 30 min expira', async () => {
    const a = await criarConta();
    const { id, codigo } = (await criar(a)).body;
    await prisma.$executeRaw`UPDATE desafio SET criado_em = now() - interval '31 minutes' WHERE id = ${id}`;
    expect((await entrar(await criarConta(), codigo)).status).toBe(410);
    expect((await criar(a)).status).toBe(201);
  });

  it('tempo esgotado: vence quem coletou mais; empatado, ninguém', async () => {
    const { a, b, desafio, pontos } = await partida();
    await coletar(a.token, pontos[0]);
    await prisma.$executeRaw`UPDATE desafio SET termina_em = now() - interval '1 second' WHERE id = ${desafio.id}`;
    expect((await atual(b)).resultado).toBe('derrota');
    expect((await atual(a)).resultado).toBe('vitoria');

    const empate = await partida();
    await prisma.$executeRaw`UPDATE desafio SET termina_em = now() - interval '1 second' WHERE id = ${empate.desafio.id}`;
    expect((await atual(empate.a)).resultado).toBe('empate');
  });

  it('rotas exigem token', async () => {
    expect((await api().get('/api/desafios/atual')).status).toBe(401);
  });
});
