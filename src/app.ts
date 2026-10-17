import path from 'path';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import authRoutes from './modules/auth/auth.routes';
import pontoRoutes from './modules/ponto/ponto.routes';
import interacaoRoutes from './modules/interacao/interacao.routes';
import telemetriaRoutes from './modules/telemetria/telemetria.routes';
import { errorMiddleware } from './shared/middlewares/error.middleware';

const app = express();


app.use(cors());
app.use(express.json());
// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Modelos 3D (.glb) exibidos em realidade aumentada — `assetUrl` do Objeto3D aponta para cá.
app.use('/modelos', express.static(path.join(__dirname, '..', 'public', 'modelos')));

// Rotas (um router por módulo)
app.use('/api', telemetriaRoutes);
app.use('/api', pontoRoutes);
app.use('/api', authRoutes);
app.use('/api', interacaoRoutes);

// Sempre por último: converte AppError e erros inesperados em resposta JSON.
app.use(errorMiddleware);

export default app;
