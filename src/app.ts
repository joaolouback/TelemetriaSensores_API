import express from 'express';
import cors from 'cors';
import syncRoutes from './routes/syncRoutes';
import pontoRoutes from './routes/pontoRoutes';
import authRoutes from './routes/authRoutes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';

const app = express();


app.use(cors());
app.use(express.json());
// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas
app.use('/api', syncRoutes);
app.use('/api', pontoRoutes);
app.use('/api', authRoutes);

export default app;
