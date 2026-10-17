-- CreateEnum
CREATE TYPE "status_desafio" AS ENUM ('AGUARDANDO', 'EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO', 'EXPIRADO');

-- AlterTable
ALTER TABLE "ponto_de_interesse" ADD COLUMN     "curiosidade" TEXT,
ADD COLUMN     "imagem_url" VARCHAR(500);

-- CreateTable
CREATE TABLE "desafio" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(6) NOT NULL,
    "status" "status_desafio" NOT NULL DEFAULT 'AGUARDANDO',
    "desafiante_id" INTEGER NOT NULL,
    "desafiado_id" INTEGER,
    "vencedor_id" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "iniciado_em" TIMESTAMP(3),
    "termina_em" TIMESTAMP(3),
    "finalizado_em" TIMESTAMP(3),

    CONSTRAINT "desafio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desafio_ponto" (
    "desafio_id" INTEGER NOT NULL,
    "ponto_de_interesse_id" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "desafio_ponto_pkey" PRIMARY KEY ("desafio_id","ponto_de_interesse_id")
);

-- CreateTable
CREATE TABLE "desafio_coleta" (
    "id" SERIAL NOT NULL,
    "desafio_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "ponto_de_interesse_id" INTEGER NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "desafio_coleta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "desafio_codigo_key" ON "desafio"("codigo");

-- CreateIndex
CREATE INDEX "idx_desafio_desafiante" ON "desafio"("desafiante_id", "status");

-- CreateIndex
CREATE INDEX "idx_desafio_desafiado" ON "desafio"("desafiado_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_desafio_coleta" ON "desafio_coleta"("desafio_id", "usuario_id", "ponto_de_interesse_id");

-- AddForeignKey
ALTER TABLE "desafio" ADD CONSTRAINT "desafio_desafiante_id_fkey" FOREIGN KEY ("desafiante_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desafio" ADD CONSTRAINT "desafio_desafiado_id_fkey" FOREIGN KEY ("desafiado_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desafio" ADD CONSTRAINT "desafio_vencedor_id_fkey" FOREIGN KEY ("vencedor_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desafio_ponto" ADD CONSTRAINT "desafio_ponto_desafio_id_fkey" FOREIGN KEY ("desafio_id") REFERENCES "desafio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desafio_ponto" ADD CONSTRAINT "desafio_ponto_ponto_de_interesse_id_fkey" FOREIGN KEY ("ponto_de_interesse_id") REFERENCES "ponto_de_interesse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desafio_coleta" ADD CONSTRAINT "desafio_coleta_desafio_id_fkey" FOREIGN KEY ("desafio_id") REFERENCES "desafio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desafio_coleta" ADD CONSTRAINT "desafio_coleta_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desafio_coleta" ADD CONSTRAINT "desafio_coleta_ponto_de_interesse_id_fkey" FOREIGN KEY ("ponto_de_interesse_id") REFERENCES "ponto_de_interesse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
