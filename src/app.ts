import path from 'path';
import express from 'express';
import cors from 'cors';
import syncRoutes from './routes/syncRoutes';
import pontoRoutes from './routes/pontoRoutes';
import authRoutes from './routes/authRoutes';
import interacaoRoutes from './routes/interacaoRoutes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';

const app = express();


app.use(cors());
app.use(express.json());
// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Modelos 3D (.glb) exibidos em realidade aumentada — `assetUrl` do Objeto3D aponta para cá.
app.use('/modelos', express.static(path.join(__dirname, '..', 'public', 'modelos')));

// Rotas
app.use('/api', syncRoutes);
app.use('/api', pontoRoutes);
app.use('/api', authRoutes);
app.use('/api', interacaoRoutes);

export default app;
