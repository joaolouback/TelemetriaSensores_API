-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ESTUDANTE', 'ADMINISTRADOR');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ESTUDANTE',
    "pontuacao_total" INTEGER NOT NULL DEFAULT 0,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos_interesse" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "raio_geofence" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "pontos_recompensa" INTEGER NOT NULL DEFAULT 10,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pontos_interesse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objetos_3d" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "asset_url" VARCHAR(500) NOT NULL,
    "formato" VARCHAR(20) NOT NULL DEFAULT 'glb',
    "escala" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "ponto_id" INTEGER NOT NULL,

    CONSTRAINT "objetos_3d_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interacoes" (
    "id" SERIAL NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude_registro" DOUBLE PRECISION NOT NULL,
    "longitude_registro" DOUBLE PRECISION NOT NULL,
    "distancia_metros" DOUBLE PRECISION,
    "validado_geofence" BOOLEAN NOT NULL DEFAULT false,
    "pontos_ganhos" INTEGER NOT NULL DEFAULT 0,
    "usuario_id" INTEGER NOT NULL,
    "ponto_id" INTEGER NOT NULL,

    CONSTRAINT "interacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conquistas" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(120) NOT NULL,
    "descricao" TEXT NOT NULL,
    "icone_url" VARCHAR(500),
    "pontos_necessarios" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "conquistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_conquistas" (
    "usuario_id" INTEGER NOT NULL,
    "conquista_id" INTEGER NOT NULL,
    "desbloqueada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_conquistas_pkey" PRIMARY KEY ("usuario_id","conquista_id")
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" SERIAL NOT NULL,
    "posicao" INTEGER NOT NULL,
    "pontuacao" INTEGER NOT NULL DEFAULT 0,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetria_sensores" (
    "id" SERIAL NOT NULL,
    "sensor_type" VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accel_x" DOUBLE PRECISION,
    "accel_y" DOUBLE PRECISION,
    "accel_z" DOUBLE PRECISION,
    "magnitude" DOUBLE PRECISION,
    "battery_level" DOUBLE PRECISION,
    "network_type" VARCHAR(50),
    "synced" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER,

    CONSTRAINT "telemetria_sensores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "objetos_3d_ponto_id_key" ON "objetos_3d"("ponto_id");

-- CreateIndex
CREATE INDEX "interacoes_usuario_id_idx" ON "interacoes"("usuario_id");

-- CreateIndex
CREATE INDEX "interacoes_ponto_id_idx" ON "interacoes"("ponto_id");

-- CreateIndex
CREATE UNIQUE INDEX "rankings_usuario_id_key" ON "rankings"("usuario_id");

-- CreateIndex
CREATE INDEX "telemetria_sensores_created_at_idx" ON "telemetria_sensores"("created_at");

-- CreateIndex
CREATE INDEX "telemetria_sensores_usuario_id_idx" ON "telemetria_sensores"("usuario_id");

-- AddForeignKey
ALTER TABLE "objetos_3d" ADD CONSTRAINT "objetos_3d_ponto_id_fkey" FOREIGN KEY ("ponto_id") REFERENCES "pontos_interesse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacoes" ADD CONSTRAINT "interacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacoes" ADD CONSTRAINT "interacoes_ponto_id_fkey" FOREIGN KEY ("ponto_id") REFERENCES "pontos_interesse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_conquistas" ADD CONSTRAINT "usuarios_conquistas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_conquistas" ADD CONSTRAINT "usuarios_conquistas_conquista_id_fkey" FOREIGN KEY ("conquista_id") REFERENCES "conquistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetria_sensores" ADD CONSTRAINT "telemetria_sensores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
