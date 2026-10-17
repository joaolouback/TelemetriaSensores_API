import path from 'path';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import authRoutes from './modules/auth/auth.routes';
import pontoRoutes from './modules/ponto/ponto.routes';
import interacaoRoutes from './modules/interacao/interacao.routes';
import telemetriaRoutes from './modules/telemetria/telemetria.routes';
import desafioRoutes from './modules/desafio/desafio.routes';
import { errorMiddleware } from './shared/middlewares/error.middleware';
import { asyncHandler } from './shared/http/async-handler';
import prisma from './shared/database/prisma';

const app = express();


app.use(cors());
// Lotes de telemetria acumulados offline passam fácil do padrão de 100 KB (~400 registros).
// O app envia em lotes de até 200; o limite folgado cobre versões antigas do app.
app.use(express.json({ limit: '2mb' }));
// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Modelos 3D (.glb) exibidos em realidade aumentada — `assetUrl` do Objeto3D aponta para cá.
app.use('/modelos', express.static(path.join(__dirname, '..', 'public', 'modelos')));
// Fotos dos locais exibidas no card após a coleta — `imagemUrl` do ponto aponta para cá.
app.use('/imagens', express.static(path.join(__dirname, '..', 'public', 'imagens')));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Saúde da API
 *     description: Usado por monitoramento e pelo serviço de hospedagem. Confere também a conexão com o banco.
 *     security: []
 *     responses:
 *       200:
 *         description: "`{ status: 'ok', banco: 'ok' }`"
 *       503:
 *         description: API no ar, mas sem conexão com o banco
 */
app.get(
  '/health',
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ok', banco: 'ok' });
    } catch {
      res.status(503).json({ status: 'degradado', banco: 'indisponivel' });
    }
  })
);

// Rotas (um router por módulo)
app.use('/api', telemetriaRoutes);
app.use('/api', pontoRoutes);
app.use('/api', authRoutes);
app.use('/api', interacaoRoutes);
app.use('/api', desafioRoutes);

// Rota inexistente: responde em JSON, como o resto da API (o padrão do Express é uma página HTML).
app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
});

// Sempre por último: converte AppError e erros inesperados em resposta JSON.
app.use(errorMiddleware);

export default app;
