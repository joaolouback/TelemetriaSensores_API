/*
  Warnings:

  - You are about to drop the `conquistas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `interacoes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `objetos_3d` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pontos_interesse` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rankings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `telemetria_sensores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuarios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuarios_conquistas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "interacoes" DROP CONSTRAINT "interacoes_ponto_id_fkey";

-- DropForeignKey
ALTER TABLE "interacoes" DROP CONSTRAINT "interacoes_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "objetos_3d" DROP CONSTRAINT "objetos_3d_ponto_id_fkey";

-- DropForeignKey
ALTER TABLE "rankings" DROP CONSTRAINT "rankings_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "telemetria_sensores" DROP CONSTRAINT "telemetria_sensores_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "usuarios_conquistas" DROP CONSTRAINT "usuarios_conquistas_conquista_id_fkey";

-- DropForeignKey
ALTER TABLE "usuarios_conquistas" DROP CONSTRAINT "usuarios_conquistas_usuario_id_fkey";

-- DropTable
DROP TABLE "conquistas";

-- DropTable
DROP TABLE "interacoes";

-- DropTable
DROP TABLE "objetos_3d";

-- DropTable
DROP TABLE "pontos_interesse";

-- DropTable
DROP TABLE "rankings";

-- DropTable
DROP TABLE "telemetria_sensores";

-- DropTable
DROP TABLE "usuarios";

-- DropTable
DROP TABLE "usuarios_conquistas";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" VARCHAR(255),
    "pontuacao_total" INTEGER NOT NULL DEFAULT 0,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrador" (
    "id" INTEGER NOT NULL,

    CONSTRAINT "administrador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conquista" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "icone_url" VARCHAR(500),
    "pontos_necessarios" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "conquista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_conquista" (
    "usuario_id" INTEGER NOT NULL,
    "conquista_id" INTEGER NOT NULL,
    "data_desbloqueio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_conquista_pkey" PRIMARY KEY ("usuario_id","conquista_id")
);

-- CreateTable
CREATE TABLE "ranking" (
    "usuario_id" INTEGER NOT NULL,
    "posicao" INTEGER NOT NULL,
    "pontuacao" INTEGER NOT NULL DEFAULT 0,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "telemetria_sensor" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" INTEGER,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "acelerometro_x" DOUBLE PRECISION,
    "acelerometro_y" DOUBLE PRECISION,
    "acelerometro_z" DOUBLE PRECISION,
    "magnitude" DOUBLE PRECISION,
    "nivel_bateria" SMALLINT,
    "tipo_rede" VARCHAR(30),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetria_sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ponto_de_interesse" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "raio_geofence" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "pontos_recompensa" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ponto_de_interesse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objeto_3d" (
    "id" SERIAL NOT NULL,
    "ponto_de_interesse_id" INTEGER NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "asset_url" VARCHAR(500) NOT NULL,
    "formato" VARCHAR(20),
    "escala" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "objeto_3d_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interacao" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "ponto_de_interesse_id" INTEGER NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude_registro" DOUBLE PRECISION NOT NULL,
    "longitude_registro" DOUBLE PRECISION NOT NULL,
    "validado_geofence" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "interacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "idx_uc_conquista" ON "usuario_conquista"("conquista_id");

-- CreateIndex
CREATE INDEX "idx_ranking_posicao" ON "ranking"("posicao");

-- CreateIndex
CREATE INDEX "idx_telemetria_usuario_ts" ON "telemetria_sensor"("usuario_id", "timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "objeto_3d_ponto_de_interesse_id_key" ON "objeto_3d"("ponto_de_interesse_id");

-- CreateIndex
CREATE INDEX "idx_interacao_usuario" ON "interacao"("usuario_id", "data_hora" DESC);

-- CreateIndex
CREATE INDEX "idx_interacao_ponto" ON "interacao"("ponto_de_interesse_id");

-- AddForeignKey
ALTER TABLE "administrador" ADD CONSTRAINT "administrador_id_fkey" FOREIGN KEY ("id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_conquista" ADD CONSTRAINT "usuario_conquista_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_conquista" ADD CONSTRAINT "usuario_conquista_conquista_id_fkey" FOREIGN KEY ("conquista_id") REFERENCES "conquista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking" ADD CONSTRAINT "ranking_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetria_sensor" ADD CONSTRAINT "telemetria_sensor_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objeto_3d" ADD CONSTRAINT "objeto_3d_ponto_de_interesse_id_fkey" FOREIGN KEY ("ponto_de_interesse_id") REFERENCES "ponto_de_interesse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacao" ADD CONSTRAINT "interacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacao" ADD CONSTRAINT "interacao_ponto_de_interesse_id_fkey" FOREIGN KEY ("ponto_de_interesse_id") REFERENCES "ponto_de_interesse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
