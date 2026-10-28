import http from 'http';
import { AddressInfo } from 'net';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';
import app from '../src/app';
import { setupWebSocket } from '../src/modules/telemetria/telemetria.gateway';
import { api, criarConta } from './helpers';

const log = (extra: Record<string, unknown> = {}) => ({
  latitude: -20.34, longitude: -40.29, acelerometro_x: 0.1, acelerometro_y: 0.2, acelerometro_z: 9.8,
  magnitude: 9.81, nivel_bateria: 0.85, tipo_rede: 'wifi', timestamp: '2026-09-19T12:00:00Z', ...extra,
});

describe('telemetria REST', () => {
  it('recusa lote vazio', async () => {
    expect((await api().post('/api/sync').send([])).status).toBe(400);
  });

  it('grava e saneia os registros (nomes novos e antigos do app)', async () => {
    const { token } = await criarConta();
    const res = await api()
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send([log(), { latitude: 'x', longitude: null, accel_x: 'NaN', battery_level: 150, network_type: 'cellular', created_at: 'quebrada' }]);
    expect(res.body.insertedCount).toBe(2);

    const logs = await api().get('/api/logs?limit=2').set('Authorization', `Bearer ${token}`);
    const [segundo, primeiro] = logs.body.data;
    expect(primeiro).toMatchObject({ nivelBateria: 85, tipoRede: 'WIFI' });
    expect(segundo).toMatchObject({ latitude: 0, acelerometroX: null, nivelBateria: 100, tipoRede: 'CELLULAR' });
  });

  it('logs exigem token e cada um vê só os próprios', async () => {
    expect((await api().get('/api/logs')).status).toBe(401);

    const dono = await criarConta();
    await api().post('/api/sync').set('Authorization', `Bearer ${dono.token}`).send([log()]);
    const outro = await criarConta();
    const logsOutro = await api().get('/api/logs').set('Authorization', `Bearer ${outro.token}`);
    expect(logsOutro.body.pagination.total).toBe(0);
  });

  it('sem token, usuario_id do corpo é ignorado', async () => {
    const vitima = await criarConta();
    await api().post('/api/sync').send([log({ latitude: -20.123, usuario_id: vitima.id })]);
    const logs = await api().get('/api/logs?limit=100').set('Authorization', `Bearer ${vitima.token}`);
    expect(logs.body.data.some((l: { latitude: number }) => l.latitude === -20.123)).toBe(false);
  });

  it('aceita 1.000 registros e responde 413 acima de 2 MB', async () => {
    const { token } = await criarConta();
    const mil = Array.from({ length: 1000 }, () => log());
    const ok = await api().post('/api/sync').set('Authorization', `Bearer ${token}`).send(mil);
    expect(ok.body.insertedCount).toBe(1000);

    const enorme = await api().post('/api/sync').set('Authorization', `Bearer ${token}`).send(Array.from({ length: 12_000 }, () => log()));
    expect(enorme.status).toBe(413);
  });
});

describe('telemetria WebSocket', () => {
  let servidor: http.Server;
  let url: string;

  beforeAll(async () => {
    servidor = http.createServer(app);
    setupWebSocket(new WebSocketServer({ server: servidor, path: '/ws' }));
    await new Promise<void>((r) => servidor.listen(0, r));
    url = `ws://localhost:${(servidor.address() as AddressInfo).port}/ws`;
  });
  afterAll(() => new Promise<void>((r) => servidor.close(() => r())));

  const conversar = async (mensagens: (object | string)[]) => {
    const ws = new WebSocket(url);
    await new Promise((r, e) => ws.once('open', r).once('error', e));
    const respostas = [];
    for (const m of mensagens) {
      const resposta = new Promise<Record<string, unknown>>((r) => ws.once('message', (d) => r(JSON.parse(String(d)))));
      ws.send(typeof m === 'string' ? m : JSON.stringify(m));
      respostas.push(await resposta);
    }
    ws.close();
    return respostas;
  };

  it('confirma o sync e responde erro para mensagens inválidas', async () => {
    const { token } = await criarConta();
    const [ack, invalida, vazia, quebrada] = await conversar([
      { type: 'sync', requestId: 'r1', token, logs: [log()] },
      { type: 'outro', requestId: 'r2' },
      { type: 'sync', requestId: 'r3', logs: [] },
      '{nao e json',
    ]);
    expect(ack).toEqual({ type: 'sync_ack', requestId: 'r1', count: 1 });
    expect(invalida).toMatchObject({ type: 'error', requestId: 'r2' });
    expect(vazia).toMatchObject({ type: 'error', requestId: 'r3' });
    expect(quebrada).toMatchObject({ type: 'error', requestId: null });
  });
});
