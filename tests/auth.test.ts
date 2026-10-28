import { describe, it, expect } from 'vitest';
import { api, criarConta } from './helpers';

describe('autenticação', () => {
  it('registra, devolve token e nunca expõe senhaHash', async () => {
    const res = await api()
      .post('/api/auth/registro')
      .send({ nome: 'Ana', email: `ana${Date.now()}@uvv.br`, senha: 'segredo123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.usuario.senhaHash).toBeUndefined();
  });

  it('valida os campos do cadastro com mensagens em português', async () => {
    const semNome = await api().post('/api/auth/registro').send({});
    expect(semNome.status).toBe(400);
    expect(semNome.body.error).toBe('Informe o nome (mínimo 2 caracteres).');

    const emailRuim = await api().post('/api/auth/registro').send({ nome: 'Ana', email: 'ruim' });
    expect(emailRuim.body.error).toBe('E-mail inválido.');

    const senhaCurta = await api().post('/api/auth/registro').send({ nome: 'Ana', email: 'a@b.co', senha: '123' });
    expect(senhaCurta.body.error).toBe('A senha deve ter pelo menos 6 caracteres.');
  });

  it('recusa e-mail duplicado', async () => {
    const { email } = await criarConta();
    const res = await api().post('/api/auth/registro').send({ nome: 'Outro', email, senha: 'segredo123' });
    expect(res.status).toBe(409);
  });

  it('login ignora maiúsculas no e-mail e recusa senha errada', async () => {
    const { email } = await criarConta();
    const ok = await api().post('/api/auth/login').send({ email: email.toUpperCase(), senha: 'segredo123' });
    expect(ok.status).toBe(200);
    expect(ok.body.usuario.senhaHash).toBeUndefined();

    const errada = await api().post('/api/auth/login').send({ email, senha: 'errada' });
    expect(errada.status).toBe(401);
  });

  it('/auth/me exige token', async () => {
    expect((await api().get('/api/auth/me')).status).toBe(401);
    const { token } = await criarConta();
    const me = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.pontuacaoTotal).toBe(0);
  });

  it('bloqueia a 11ª senha errada do mesmo e-mail, sem afetar outros e-mails', async () => {
    const alvo = await criarConta('Alvo');
    let ultimo = await api().post('/api/auth/login').send({ email: alvo.email, senha: 'errada0' });
    for (let i = 1; i <= 10; i++) {
      ultimo = await api().post('/api/auth/login').send({ email: alvo.email, senha: `errada${i}` });
    }
    expect(ultimo.status).toBe(429);

    const outro = await criarConta('Outro');
    const login = await api().post('/api/auth/login').send({ email: outro.email, senha: 'segredo123' });
    expect(login.status).toBe(200);
  });
});
