-- CreateTable
CREATE TABLE "contador" (
    "cuil" BIGINT NOT NULL,
    "id_estudio" INTEGER,

    CONSTRAINT "cuil" PRIMARY KEY ("cuil")
);

-- CreateTable
CREATE TABLE "cliente" (
    "cuil" BIGINT NOT NULL,
    "id_estudio" INTEGER,
    "contador" BIGINT,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("cuil")
);

-- CreateTable
CREATE TABLE "comprobante" (
    "numero_boleta" SERIAL NOT NULL,
    "periodo_fiscal" DATE,
    "importe" REAL,

    CONSTRAINT "comprobante_pkey" PRIMARY KEY ("numero_boleta")
);

-- CreateTable
CREATE TABLE "entidad_tributaria" (
    "id_entidad" SERIAL NOT NULL,
    "nombre" TEXT,
    "url" TEXT,

    CONSTRAINT "entidad_tributaria_pkey" PRIMARY KEY ("id_entidad")
);

-- CreateTable
CREATE TABLE "estudio_contable" (
    "id_estudio" SERIAL NOT NULL,

    CONSTRAINT "estudio_contable_pkey" PRIMARY KEY ("id_estudio")
);

-- CreateTable
CREATE TABLE "impuesto" (
    "id_impuesto" SERIAL NOT NULL,
    "formato" TEXT,

    CONSTRAINT "impuesto_pkey" PRIMARY KEY ("id_impuesto")
);

-- CreateTable
CREATE TABLE "inscripto_en" (
    "clave" TEXT,
    "cuil_cliente" BIGINT NOT NULL,
    "id_entidad" INTEGER NOT NULL,

    CONSTRAINT "inscripto_en_pkey" PRIMARY KEY ("cuil_cliente","id_entidad")
);

-- CreateTable
CREATE TABLE "liquidacion" (
    "numero_boleta" SERIAL NOT NULL,
    "periodo_fiscal" DATE,
    "importe" REAL,
    "estado" TEXT,
    "cuil_cliente" BIGINT,
    "id_impuesto" INTEGER,
    "numero_boleta_comprobante" INTEGER,

    CONSTRAINT "liquidacion_pkey" PRIMARY KEY ("numero_boleta")
);

-- CreateTable
CREATE TABLE "usuario" (
    "CUIL_usuario" BIGINT NOT NULL,
    "nombre_usuario" TEXT,
    "apellido_usuario" TEXT,
    "email" TEXT,
    "telefono" TEXT,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("CUIL_usuario")
);

-- CreateTable
CREATE TABLE "clerk_user" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "cuil" TEXT,
    "rol" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clerk_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turno" (
    "fecha" DATE NOT NULL,
    "hora" TIME(0) NOT NULL,
    "cuil_contador" BIGINT NOT NULL,
    "cuil_cliente" BIGINT NOT NULL,

    CONSTRAINT "pk_turno" PRIMARY KEY ("fecha","hora","cuil_contador","cuil_cliente")
);

-- CreateIndex
CREATE UNIQUE INDEX "liquidacion_numero_boleta_comprobante_key" ON "liquidacion"("numero_boleta_comprobante");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- AddForeignKey
ALTER TABLE "contador" ADD CONSTRAINT "cuil_usuario" FOREIGN KEY ("cuil") REFERENCES "usuario"("CUIL_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contador" ADD CONSTRAINT "id_estudio" FOREIGN KEY ("id_estudio") REFERENCES "estudio_contable"("id_estudio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cuil_usuario" FOREIGN KEY ("cuil") REFERENCES "usuario"("CUIL_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "id_estudio" FOREIGN KEY ("id_estudio") REFERENCES "estudio_contable"("id_estudio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "contador_cliente" FOREIGN KEY ("contador") REFERENCES "contador"("cuil") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscripto_en" ADD CONSTRAINT "cuil_cliente" FOREIGN KEY ("cuil_cliente") REFERENCES "cliente"("cuil") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscripto_en" ADD CONSTRAINT "id_entidad" FOREIGN KEY ("id_entidad") REFERENCES "entidad_tributaria"("id_entidad") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "liquidacion" ADD CONSTRAINT "cuil_cliente" FOREIGN KEY ("cuil_cliente") REFERENCES "cliente"("cuil") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "liquidacion" ADD CONSTRAINT "id_impuesto" FOREIGN KEY ("id_impuesto") REFERENCES "impuesto"("id_impuesto") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "liquidacion" ADD CONSTRAINT "numero_boleta" FOREIGN KEY ("numero_boleta_comprobante") REFERENCES "comprobante"("numero_boleta") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "turno" ADD CONSTRAINT "cuil_contador" FOREIGN KEY ("cuil_contador") REFERENCES "contador"("cuil") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "turno" ADD CONSTRAINT "cuil_cliente" FOREIGN KEY ("cuil_cliente") REFERENCES "cliente"("cuil") ON DELETE NO ACTION ON UPDATE NO ACTION;
