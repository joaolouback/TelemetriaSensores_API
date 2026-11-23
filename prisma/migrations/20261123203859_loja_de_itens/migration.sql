-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "moldura_equipada" VARCHAR(40),
ADD COLUMN     "pontos_gastos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rastro_equipado" VARCHAR(40),
ADD COLUMN     "tema_equipado" VARCHAR(40),
ADD COLUMN     "titulo_equipado" VARCHAR(40);

-- CreateTable
CREATE TABLE "usuario_item" (
    "usuario_id" INTEGER NOT NULL,
    "item_codigo" VARCHAR(40) NOT NULL,
    "data_compra" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_item_pkey" PRIMARY KEY ("usuario_id","item_codigo")
);

-- AddForeignKey
ALTER TABLE "usuario_item" ADD CONSTRAINT "usuario_item_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
