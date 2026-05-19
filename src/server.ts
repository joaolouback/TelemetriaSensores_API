import app from './app';
import dotenv from 'dotenv';
import pool from './database/db';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Validando a conexão com o banco antes de escutar a porta
    const connection = await pool.getConnection();
    console.log('✅ Conectado ao banco de dados MySQL com sucesso!');
    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro crítico: Falha ao conectar ao banco de dados.', error);
    process.exit(1);
  }
};

startServer();
