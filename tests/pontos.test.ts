import { describe, it, expect } from 'vitest';
import { api, listarPontos } from './helpers';

describe('pontos de interesse', () => {
  it('lista os 10 pontos com objeto 3D e campos do card do local', async () => {
    const res = await api().get('/api/pontos');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(10);
    const [ponto] = res.body.data;
    expect(ponto.objeto3d.assetUrl).toBe('/modelos/cristal.glb');
    expect(ponto).toHaveProperty('curiosidade');
    expect(ponto).toHaveProperty('imagemUrl');
  });

  it('ordena por distância e indica quem está no raio', async () => {
    const [p1] = await listarPontos();
    const res = await api().get(`/api/pontos/proximos?lat=${p1.latitude}&lon=${p1.longitude}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].id).toBe(p1.id);
    expect(res.body.data[0].distanciaMetros).toBe(0);
    expect(res.body.dentroDeAlgumRaio).toContain(p1.nome);
  });

  it('valida lat/lon e o id', async () => {
    expect((await api().get('/api/pontos/proximos?lat=abc')).status).toBe(400);
    expect((await api().get('/api/pontos/99999')).status).toBe(404);
  });
});
