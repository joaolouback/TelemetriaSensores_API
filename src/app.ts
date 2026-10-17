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

// Rotas (um router por módulo)
app.use('/api', telemetriaRoutes);
app.use('/api', pontoRoutes);
app.use('/api', authRoutes);
app.use('/api', interacaoRoutes);
app.use('/api', desafioRoutes);

// Sempre por último: converte AppError e erros inesperados em resposta JSON.
app.use(errorMiddleware);

export default app;
