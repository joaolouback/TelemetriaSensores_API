import { describe, it, expect, beforeAll } from 'vitest';
import { api, criarConta, listarPontos, coletar, pontuacao, PontoTeste } from './helpers';

let pontos: PontoTeste[];
beforeAll(async () => {
  pontos = await listarPontos();
});

describe('check-in (coleta em AR)', () => {
  it('exige token e valida o corpo', async () => {
    const [p] = pontos;
    expect((await api().post('/api/interacoes').send({ pontoId: p.id, latitude: 0, longitude: 0 })).status).toBe(401);

    const { token } = await criarConta();
    const semPonto = await api().post('/api/interacoes').set('Authorization', `Bearer ${token}`).send({ latitude: 1, longitude: 1 });
    expect(semPonto.body.error).toBe('Informe o `pontoId` numérico do ponto.');

    const inexistente = await coletar(token, { ...p, id: 99999 });
    expect(inexistente.status).toBe(404);
  });

  it('recusa quem está fora do raio, informando a distância', async () => {
    const { token } = await criarConta();
    const [p] = pontos;
    const res = await coletar(token, { ...p, latitude: p.latitude + 0.01 });
    expect(res.status).toBe(422);
    expect(res.body.distanciaMetros).toBeGreaterThan(1000);
  });

  it('credita os pontos uma única vez e desbloqueia conquistas', async () => {
    const { token } = await criarConta();
    const [p1, p2] = pontos;

    const primeiro = await coletar(token, p1);
    expect(primeiro.status).toBe(201);
    expect(primeiro.body.pontosGanhos).toBe(p1.pontosRecompensa);
    expect(primeiro.body.novasConquistas.map((c: { titulo: string }) => c.titulo)).toContain('Primeiros Passos');

    expect((await coletar(token, p1)).status).toBe(409);

    await coletar(token, p2);
    expect(await pontuacao(token)).toBe(p1.pontosRecompensa + p2.pontosRecompensa);

    const minhas = await api().get('/api/interacoes/minhas').set('Authorization', `Bearer ${token}`);
    expect(minhas.body.pontosColetados).toEqual([p1.id, p2.id]);
  });

  it('toque duplo simultâneo credita uma vez só', async () => {
    const { token } = await criarConta();
    const [p] = pontos;
    const respostas = await Promise.all([coletar(token, p), coletar(token, p)]);
    expect(respostas.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await pontuacao(token)).toBe(p.pontosRecompensa);
  });

  it('recusa GPS falso e precisão pior que 50 m', async () => {
    const { token } = await criarConta();
    const [p] = pontos;
    const falso = await coletar(token, p, { mockado: true });
    expect(falso.status).toBe(422);
    expect(falso.body.error).toMatch(/simulada/);

    const impreciso = await coletar(token, p, { precisao: 80 });
    expect(impreciso.status).toBe(422);
    expect(impreciso.body.precisaoMaxima).toBe(50);

    expect((await coletar(token, p, { precisao: 8, mockado: false })).status).toBe(201);
  });
});
