import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UVV Go API',
      version: '2.0.0',
      description:
        'API REST do projeto UVV Go — pontos de interesse do campus, geofencing e telemetria de sensores (offline-first). Node.js + Express + Prisma + PostgreSQL.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor Local',
      },
    ],
    // Botão "Authorize": cole o token do login/registro para testar as rotas protegidas.
    // Nas rotas públicas o token é simplesmente ignorado.
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
