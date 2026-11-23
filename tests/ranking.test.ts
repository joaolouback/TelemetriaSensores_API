import { describe, it, expect } from 'vitest';
import { api, criarConta, listarPontos, coletar } from './helpers';
import prisma from '../src/shared/database/prisma';

describe('ranking e conquistas', () => {
  it('exige login', async () => {
    expect((await api().get('/api/ranking')).status).toBe(401);
    expect((await api().get('/api/conquistas')).status).toBe(401);
  });

  it('mostra o usuário, abrevia o nome e ordena por pontos', async () => {
    const conta = await criarConta('Maria Souza Lima');
    const [ponto] = await listarPontos();
    expect((await coletar(conta.token, ponto)).status).toBe(201);

    const res = await api().get('/api/ranking').set('Authorization', `Bearer ${conta.token}`);
    expect(res.status).toBe(200);
    expect(res.body.eu.id).toBe(conta.id);
    expect(res.body.eu.nome).toBe('Maria L.');
    expect(res.body.eu.pontuacaoTotal).toBe(ponto.pontosRecompensa);
    expect(res.body.total).toBeGreaterThanOrEqual(res.body.jogadores.length);

    const pontos = res.body.jogadores.map((j: { pontuacaoTotal: number }) => j.pontuacaoTotal);
    expect(pontos).toEqual([...pontos].sort((a, b) => b - a));
  });

  it('desbloqueia as conquistas de pontos ajustados fora do jogo (direto no banco)', async () => {
    const conta = await criarConta('Ajuste Manual');
    await prisma.usuario.update({ where: { id: conta.id }, data: { pontuacaoTotal: 200 } });

    const res = await api().get('/api/conquistas').set('Authorization', `Bearer ${conta.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((c: { desbloqueada: boolean }) => c.desbloqueada)).toBe(true);
  });

  it('lista as conquistas marcando as desbloqueadas', async () => {
    const conta = await criarConta('Conquistador');
    const [ponto] = await listarPontos();
    await coletar(conta.token, ponto);

    const res = await api().get('/api/conquistas').set('Authorization', `Bearer ${conta.token}`);
    expect(res.status).toBe(200);
    const desbloqueadas = res.body.data.filter((c: { desbloqueada: boolean }) => c.desbloqueada);
    expect(desbloqueadas.length).toBeGreaterThanOrEqual(1);
  });
});

describe('foto de perfil', () => {
  // PNG 1x1 válido.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );

  it('envia, aparece no ranking, é servida e pode ser removida', async () => {
    const conta = await criarConta('Foto Teste');
    const auth = { Authorization: `Bearer ${conta.token}` };

    const envio = await api().put('/api/usuarios/me/foto').set(auth).set('Content-Type', 'image/png').send(png);
    expect(envio.status).toBe(200);
    expect(envio.body.fotoUrl).toMatch(/^\/avatares\/\d+-\d+\.png$/);

    expect((await api().get(envio.body.fotoUrl)).status).toBe(200);
    expect((await api().get('/api/ranking').set(auth)).body.eu.fotoUrl).toBe(envio.body.fotoUrl);

    const remocao = await api().delete('/api/usuarios/me/foto').set(auth);
    expect(remocao.body.fotoUrl).toBeNull();
    expect((await api().get(envio.body.fotoUrl)).status).toBe(404);
  });

  it('recusa arquivo que não é imagem e exige login', async () => {
    const conta = await criarConta('Foto Invalida');
    const falso = await api()
      .put('/api/usuarios/me/foto')
      .set('Authorization', `Bearer ${conta.token}`)
      .set('Content-Type', 'image/png')
      .send(Buffer.from('isto não é um png'));
    expect(falso.status).toBe(400);
    expect((await api().put('/api/usuarios/me/foto').set('Content-Type', 'image/png').send(png)).status).toBe(401);
  });
});

describe('perfil público do jogador', () => {
  it('mostra os dados de jogo e nunca o e-mail', async () => {
    const outro = await criarConta('Ana Beatriz Costa');
    const eu = await criarConta('Observador');
    const [ponto] = await listarPontos();
    await coletar(outro.token, ponto);

    const res = await api().get(`/api/jogadores/${outro.id}`).set('Authorization', `Bearer ${eu.token}`);
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Ana C.');
    expect(res.body.pontuacaoTotal).toBe(ponto.pontosRecompensa);
    expect(res.body.locaisColetados).toBe(1);
    expect(res.body.ehVoce).toBe(false);
    expect(res.body).not.toHaveProperty('email');
    expect(res.body.conquistas.some((c: { desbloqueada: boolean }) => c.desbloqueada)).toBe(true);
    expect(res.body.desafios).toEqual({ vitorias: 0, derrotas: 0, empates: 0 });
  });

  it('valida o id e responde 404 para jogador inexistente', async () => {
    const eu = await criarConta('Curioso');
    const auth = { Authorization: `Bearer ${eu.token}` };
    expect((await api().get('/api/jogadores/abc').set(auth)).status).toBe(400);
    expect((await api().get('/api/jogadores/999999').set(auth)).status).toBe(404);
    expect((await api().get('/api/jogadores/1')).status).toBe(401);
  });
});
