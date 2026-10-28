import { describe, it, expect } from 'vitest';
import { api } from './helpers';

describe('infraestrutura', () => {
  it('GET /health confirma API e banco', async () => {
    const res = await api().get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', banco: 'ok' });
  });

  it('rota inexistente responde 404 em JSON', async () => {
    const res = await api().get('/api/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('/api/nao-existe');
  });

  it('JSON malformado responde 400', async () => {
    const res = await api().post('/api/sync').set('Content-Type', 'application/json').send('{quebrado');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JSON/);
  });

  it('serve o modelo 3D em GLB', async () => {
    // GLB é binário: lê o corpo como Buffer (o Supertest só decodifica texto/JSON sozinho).
    const res = await api()
      .get('/modelos/cristal.glb')
      .buffer(true)
      .parse((r, pronto) => {
        const partes: Buffer[] = [];
        r.on('data', (c: Buffer) => partes.push(c));
        r.on('end', () => pronto(null, Buffer.concat(partes)));
      });
    expect(res.status).toBe(200);
    expect((res.body as Buffer).subarray(0, 4).toString()).toBe('glTF');
  });
});
