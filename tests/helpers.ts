/** Utilitários compartilhados pelos testes de integração. */
import request from 'supertest';
import app from '../src/app';

export const api = () => request(app);

let contador = 0;

/** Cria uma conta nova (e-mail único) e devolve o id e o token. */
export async function criarConta(nome = 'Jogador') {
  contador += 1;
  const email = `${nome.toLowerCase().replace(/\s+/g, '')}${Date.now()}${contador}@aluno.uvv.br`;
  const res = await api().post('/api/auth/registro').send({ nome, email, senha: 'segredo123' });
  if (res.status !== 201) throw new Error(`Falha ao criar conta: ${res.status} ${JSON.stringify(res.body)}`);
  return { id: res.body.usuario.id as number, token: res.body.token as string, email };
}

export interface PontoTeste {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
  raioGeofence: number;
  pontosRecompensa: number;
}

export async function listarPontos(): Promise<PontoTeste[]> {
  return (await api().get('/api/pontos')).body.data;
}

/** Check-in exatamente sobre o ponto (dentro do raio), com GPS bom. */
export function coletar(token: string, ponto: PontoTeste, extra: Record<string, unknown> = {}) {
  if (!ponto) throw new Error('coletar: ponto indefinido');
  return api()
    .post('/api/interacoes')
    .set('Authorization', `Bearer ${token}`)
    .send({ pontoId: ponto.id, latitude: ponto.latitude, longitude: ponto.longitude, precisao: 5, ...extra });
}

export async function pontuacao(token: string): Promise<number> {
  return (await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`)).body.pontuacaoTotal;
}
