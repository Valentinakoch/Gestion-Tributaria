/*
  Warnings:

  - You are about to drop the `clerk_user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuario` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[clerk_id]` on the table `cliente` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clerk_id]` on the table `contador` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `contador` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "contador" RENAME CONSTRAINT "cuil" TO "contador_pkey";

ALTER TABLE "contador"
ADD COLUMN     "apellido" TEXT,
ADD COLUMN     "clerk_id" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "nombre" TEXT,
ADD COLUMN     "telefono" TEXT;

-- AlterTable
ALTER TABLE "cliente"
ADD COLUMN     "clerk_id" TEXT;

-- DropForeignKey
ALTER TABLE "contador" DROP CONSTRAINT IF EXISTS "cuil_usuario";

-- DropForeignKey
ALTER TABLE "cliente" DROP CONSTRAINT IF EXISTS "cuil_usuario";

-- DropTable
DROP TABLE "clerk_user";

-- DropTable
DROP TABLE "usuario";

-- CreateIndex
CREATE UNIQUE INDEX "cliente_clerk_id_key" ON "cliente"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "contador_clerk_id_key" ON "contador"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "contador_email_key" ON "contador"("email");
