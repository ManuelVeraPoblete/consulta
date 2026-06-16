-- Migración: Órdenes de Examen
-- Ejecutar una sola vez en la base de datos

CREATE TABLE IF NOT EXISTS ordenes_examen (
  id                      INT          AUTO_INCREMENT PRIMARY KEY,
  atencion_id             INT          NULL,
  cita_id                 INT          NULL,
  paciente_id             INT          NOT NULL,
  medico_id               INT          NOT NULL,
  diagnostico_presuntivo  TEXT         NULL,
  instrucciones_generales TEXT         NULL,
  urgencia                ENUM('rutina','urgente','muy_urgente') NOT NULL DEFAULT 'rutina',
  estado                  ENUM('pendiente','realizado','cancelado') NOT NULL DEFAULT 'pendiente',
  createdAt               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX ordenes_paciente_idx  (paciente_id),
  INDEX ordenes_medico_idx    (medico_id),
  INDEX ordenes_cita_idx      (cita_id),
  INDEX ordenes_atencion_idx  (atencion_id)
);

CREATE TABLE IF NOT EXISTS orden_examen_items (
  id            INT         AUTO_INCREMENT PRIMARY KEY,
  orden_id      INT         NOT NULL,
  tipo          ENUM('laboratorio','imagen','electrocardiograma','otro') NOT NULL DEFAULT 'laboratorio',
  nombre_examen VARCHAR(200) NOT NULL,
  codigo        VARCHAR(50)  NULL,
  instrucciones TEXT         NULL,
  INDEX orden_items_orden_idx (orden_id)
);
