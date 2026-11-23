import { describe, it, expect } from 'vitest';
import { api, criarConta, listarPontos, coletar, pontuacao } from './helpers';

/** Conta nova com pelo menos `minimo` pontos (coleta pontos do campus até chegar lá). */
async function contaComPontos(nome: string, minimo: number) {
  const conta = await criarConta(nome);
  for (const ponto of await listarPontos()) {
    if ((await pontuacao(conta.token)) >= minimo) break;
    await coletar(conta.token, ponto);
  }
  return { ...conta, auth: { Authorization: `Bearer ${conta.token}` } };
}

describe('loja de itens', () => {
  it('exige login', async () => {
    expect((await api().get('/api/loja')).status).toBe(401);
    expect((await api().post('/api/loja/itens/moldura-bronze/compra')).status).toBe(401);
  });

  it('mostra o catálogo e recusa compra sem saldo', async () => {
    const conta = await criarConta('Sem Saldo');
    const auth = { Authorization: `Bearer ${conta.token}` };

    const loja = await api().get('/api/loja').set(auth);
    expect(loja.status).toBe(200);
    expect(loja.body.saldo).toBe(0);
    const categorias = new Set(loja.body.itens.map((i: { categoria: string }) => i.categoria));
    expect([...categorias].sort()).toEqual(['MOLDURA', 'RASTRO', 'TEMA', 'TITULO']);
    expect(loja.body.itens.every((i: { possui: boolean }) => !i.possui)).toBe(true);

    const compra = await api().post('/api/loja/itens/moldura-bronze/compra').set(auth);
    expect(compra.status).toBe(422);
    expect(compra.body.saldo).toBe(0);
  });

  it('compra desconta do saldo, equipa e não muda a pontuação do ranking', async () => {
    const conta = await contaComPontos('Comprador Teste', 10);
    const antes = await pontuacao(conta.token);

    const compra = await api().post('/api/loja/itens/moldura-bronze/compra').set(conta.auth);
    expect(compra.status).toBe(201);
    expect(compra.body.saldo).toBe(antes - 10);
    expect(compra.body.pontosGastos).toBe(10);
    expect(compra.body.equipados.MOLDURA).toBe('moldura-bronze');
    const item = compra.body.itens.find((i: { codigo: string }) => i.codigo === 'moldura-bronze');
    expect(item).toMatchObject({ possui: true, equipado: true });

    expect(await pontuacao(conta.token)).toBe(antes);
    const ranking = await api().get('/api/ranking').set(conta.auth);
    expect(ranking.body.eu.pontuacaoTotal).toBe(antes);
    expect(ranking.body.eu.moldura).toMatchObject({ codigo: 'moldura-bronze', cores: ['#CD7F32'] });

    const perfil = await api().get(`/api/jogadores/${conta.id}`).set(conta.auth);
    expect(perfil.body.moldura.codigo).toBe('moldura-bronze');

    expect((await api().post('/api/loja/itens/moldura-bronze/compra').set(conta.auth)).status).toBe(409);
  });

  it('dois toques simultâneos em "Comprar" cobram uma vez só', async () => {
    const conta = await contaComPontos('Toque Duplo Loja', 10);
    const [a, b] = await Promise.all([
      api().post('/api/loja/itens/titulo-calouro/compra').set(conta.auth),
      api().post('/api/loja/itens/titulo-calouro/compra').set(conta.auth),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);

    const loja = await api().get('/api/loja').set(conta.auth);
    expect(loja.body.pontosGastos).toBe(10);
  });

  it('só equipa itens comprados, da categoria certa, e permite voltar ao padrão', async () => {
    const conta = await contaComPontos('Equipador Teste', 10);
    await api().post('/api/loja/itens/titulo-calouro/compra').set(conta.auth);

    const naoComprado = await api()
      .put('/api/loja/equipados')
      .set(conta.auth)
      .send({ categoria: 'MOLDURA', codigo: 'moldura-ouro' });
    expect(naoComprado.status).toBe(403);

    const outraCategoria = await api()
      .put('/api/loja/equipados')
      .set(conta.auth)
      .send({ categoria: 'MOLDURA', codigo: 'titulo-calouro' });
    expect(outraCategoria.status).toBe(400);

    const inexistente = await api().post('/api/loja/itens/nao-existe/compra').set(conta.auth);
    expect(inexistente.status).toBe(404);

    const tirar = await api().put('/api/loja/equipados').set(conta.auth).send({ categoria: 'TITULO', codigo: null });
    expect(tirar.status).toBe(200);
    expect(tirar.body.equipados.TITULO).toBeNull();

    const recolocar = await api()
      .put('/api/loja/equipados')
      .set(conta.auth)
      .send({ categoria: 'TITULO', codigo: 'titulo-calouro' });
    expect(recolocar.body.equipados.TITULO).toBe('titulo-calouro');
    const ranking = await api().get('/api/ranking').set(conta.auth);
    expect(ranking.body.eu.titulo).toBe('Calouro Curioso');
  });
});
