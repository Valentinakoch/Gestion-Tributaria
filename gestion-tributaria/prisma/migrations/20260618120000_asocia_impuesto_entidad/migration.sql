ALTER TABLE "impuesto"
ADD COLUMN "id_entidad" INTEGER;

ALTER TABLE "impuesto"
ADD CONSTRAINT "id_entidad_impuesto"
FOREIGN KEY ("id_entidad") REFERENCES "entidad_tributaria"("id_entidad")
ON DELETE NO ACTION ON UPDATE NO ACTION;
