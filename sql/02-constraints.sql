-- Constraints adicionales para las tablas de vehículos

-- Check constraints para validación de datos
ALTER TABLE vehiculos 
ADD CONSTRAINT chk_patente_format CHECK (patente ~* '^[A-Z]{3}[0-9]{3}$|^[A-Z]{2}[0-9]{3}[A-Z]{2}$');

ALTER TABLE vehiculos 
ADD CONSTRAINT chk_fecha_patentamiento CHECK (fecha_patentamiento >= '2004-01-01' AND fecha_patentamiento <= CURRENT_DATE);

ALTER TABLE vehiculos 
ADD CONSTRAINT chk_chofer_designado_not_empty CHECK (TRIM(chofer_designado) != '');

ALTER TABLE vehiculos 
ADD CONSTRAINT chk_kilometraje_positivo CHECK (kilometraje >= 0 AND kilometraje <= 500000);

-- Constraints para tablas hijas
ALTER TABLE autos 
ADD CONSTRAINT chk_vencimiento_matafuego CHECK (vencimiento_matafuego >= '2024-01-01' AND vencimiento_matafuego <= '2026-12-31');

ALTER TABLE motos 
ADD CONSTRAINT chk_cilindrada CHECK (cilindrada >= 50 AND cilindrada <= 2000);

ALTER TABLE camiones 
ADD CONSTRAINT chk_cubiertas_auxilio CHECK (cubiertas_auxilio >= 1 AND cubiertas_auxilio <= 6);

ALTER TABLE camiones 
ADD CONSTRAINT chk_limite_km_diario CHECK (limite_km_diario >= 200 AND limite_km_diario <= 1000);
