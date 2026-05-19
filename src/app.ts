import express from 'express';
import cors from 'cors';
import syncRoutes from './routes/syncRoutes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Analisará os payloads JSON

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas
app.use('/api', syncRoutes);

export default app;
