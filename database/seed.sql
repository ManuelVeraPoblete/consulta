-- ============================================================
--  consulta_medica — Script de creación y seed de datos
--  Generado: 2026-05-18
--  Contraseñas de prueba:
--    admin      → Admin123!
--    médicos    → Medico123!
--    secretarias→ Secretaria123!
--    pacientes  → Paciente123!
-- ============================================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ────────────────────────────────────────────────────────────
-- BASE DE DATOS
-- ────────────────────────────────────────────────────────────
DROP DATABASE IF EXISTS consulta_medica;
CREATE DATABASE consulta_medica
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE consulta_medica;

-- ────────────────────────────────────────────────────────────
-- 1. ESPECIALIDADES
-- ────────────────────────────────────────────────────────────
CREATE TABLE especialidades (
  id     INT          NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  activo TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY especialidades_nombre_uq (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 2. SUBESPECIALIDADES
-- ────────────────────────────────────────────────────────────
CREATE TABLE subespecialidades (
  id               INT          NOT NULL AUTO_INCREMENT,
  especialidad_id  INT          NOT NULL,
  nombre           VARCHAR(100) NOT NULL,
  activo           TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY fk_sub_esp (especialidad_id),
  CONSTRAINT fk_sub_esp FOREIGN KEY (especialidad_id) REFERENCES especialidades (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 3. PREVISIONES
-- ────────────────────────────────────────────────────────────
CREATE TABLE previsiones (
  id     INT                       NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100)              NOT NULL,
  tipo   ENUM('fonasa','isapre')   NOT NULL,
  activo TINYINT(1)                NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY previsiones_nombre_uq (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 4. USUARIOS
-- ────────────────────────────────────────────────────────────
CREATE TABLE usuarios (
  id        INT                                          NOT NULL AUTO_INCREMENT,
  nombre    VARCHAR(100)                                 NOT NULL,
  apellido  VARCHAR(100)                                 NOT NULL,
  rut       VARCHAR(12)                                  DEFAULT NULL,
  telefono  VARCHAR(20)                                  DEFAULT NULL,
  email     VARCHAR(150)                                 NOT NULL,
  password  VARCHAR(255)                                 NOT NULL,
  rol       ENUM('admin','medico','secretaria','paciente') NOT NULL DEFAULT 'paciente',
  activo    TINYINT(1)                                   NOT NULL DEFAULT 1,
  createdAt DATETIME                                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME                                     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY usuarios_email_uq (email),
  UNIQUE KEY usuarios_rut_uq (rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 5. MÉDICOS PERFIL
-- ────────────────────────────────────────────────────────────
CREATE TABLE medicos_perfil (
  id                       INT          NOT NULL AUTO_INCREMENT,
  usuario_id               INT          NOT NULL,
  numero_registro          VARCHAR(30)  DEFAULT NULL,
  fecha_registro_prestador DATE         DEFAULT NULL,
  titulo_profesional       VARCHAR(150) DEFAULT NULL,
  especialidad_id          INT          DEFAULT NULL,
  entidad_certificadora    VARCHAR(150) DEFAULT NULL,
  vigencia_especialidad    DATE         DEFAULT NULL,
  direccion_consulta       VARCHAR(200) DEFAULT NULL,
  telefono_consulta        VARCHAR(20)  DEFAULT NULL,
  descripcion              TEXT,
  modalidad_presencial     TINYINT(1)   NOT NULL DEFAULT 0,
  modalidad_telemedicina   TINYINT(1)   NOT NULL DEFAULT 0,
  acepta_isapre            TINYINT(1)   NOT NULL DEFAULT 0,
  acepta_fonasa            TINYINT(1)   NOT NULL DEFAULT 0,
  acepta_particular        TINYINT(1)   NOT NULL DEFAULT 0,
  valor_particular         INT          DEFAULT NULL,
  createdAt                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY medicos_perfil_usuario_uq (usuario_id),
  UNIQUE KEY medicos_perfil_registro_uq (numero_registro),
  KEY fk_perfil_esp (especialidad_id),
  CONSTRAINT fk_perfil_usuario FOREIGN KEY (usuario_id)       REFERENCES usuarios (id),
  CONSTRAINT fk_perfil_esp     FOREIGN KEY (especialidad_id)  REFERENCES especialidades (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 6. MÉDICO – SUBESPECIALIDADES (pivot)
-- ────────────────────────────────────────────────────────────
CREATE TABLE medico_subespecialidades (
  medico_id          INT NOT NULL,
  subespecialidad_id INT NOT NULL,
  PRIMARY KEY (medico_id, subespecialidad_id),
  CONSTRAINT fk_msub_medico FOREIGN KEY (medico_id)          REFERENCES usuarios (id),
  CONSTRAINT fk_msub_sub   FOREIGN KEY (subespecialidad_id)  REFERENCES subespecialidades (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 7. MÉDICO – PREVISIONES (pivot)
-- ────────────────────────────────────────────────────────────
CREATE TABLE medico_previsiones (
  medico_id    INT NOT NULL,
  prevision_id INT NOT NULL,
  PRIMARY KEY (medico_id, prevision_id),
  CONSTRAINT fk_mprev_medico   FOREIGN KEY (medico_id)    REFERENCES usuarios (id),
  CONSTRAINT fk_mprev_prevision FOREIGN KEY (prevision_id) REFERENCES previsiones (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 8. SECRETARIA – MÉDICO (pivot)
-- ────────────────────────────────────────────────────────────
CREATE TABLE secretaria_medico (
  secretaria_id INT NOT NULL,
  medico_id     INT NOT NULL,
  PRIMARY KEY (secretaria_id, medico_id),
  CONSTRAINT fk_sm_secretaria FOREIGN KEY (secretaria_id) REFERENCES usuarios (id),
  CONSTRAINT fk_sm_medico     FOREIGN KEY (medico_id)     REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 9. PACIENTES
-- ────────────────────────────────────────────────────────────
CREATE TABLE pacientes (
  id                          INT                                        NOT NULL AUTO_INCREMENT,
  nombre                      VARCHAR(100)                               NOT NULL,
  apellido                    VARCHAR(100)                               NOT NULL,
  rut                         VARCHAR(20)                                DEFAULT NULL,
  fecha_nacimiento            DATE                                       NOT NULL,
  genero                      ENUM('masculino','femenino','otro')        NOT NULL,
  telefono                    VARCHAR(25)                                DEFAULT NULL,
  email                       VARCHAR(150)                               DEFAULT NULL,
  direccion                   VARCHAR(200)                               DEFAULT NULL,
  ciudad                      VARCHAR(100)                               DEFAULT NULL,
  prevision_salud             ENUM('fonasa','isapre','particular')       NOT NULL DEFAULT 'fonasa',
  nombre_isapre               VARCHAR(100)                               DEFAULT NULL,
  numero_fonasa               VARCHAR(50)                                DEFAULT NULL,
  prevision_social            ENUM('afp','ips','ninguna')                NOT NULL DEFAULT 'ninguna',
  nombre_afp                  VARCHAR(100)                               DEFAULT NULL,
  grupo_sanguineo             ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-','desconocido') NOT NULL DEFAULT 'desconocido',
  alergias                    TEXT,
  antecedentes                TEXT,
  contacto_emergencia_nombre  VARCHAR(150)                               DEFAULT NULL,
  contacto_emergencia_telefono VARCHAR(25)                               DEFAULT NULL,
  activo                      TINYINT(1)                                 NOT NULL DEFAULT 1,
  createdAt                   DATETIME                                   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt                   DATETIME                                   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY pacientes_rut_uq (rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 10. CITAS
-- ────────────────────────────────────────────────────────────
CREATE TABLE citas (
  id            INT                                               NOT NULL AUTO_INCREMENT,
  paciente_id   INT                                               NOT NULL,
  medico_id     INT                                               NOT NULL,
  secretaria_id INT                                               DEFAULT NULL,
  fecha_hora    DATETIME                                          NOT NULL,
  duracion_min  INT                                               NOT NULL DEFAULT 30,
  motivo        TEXT,
  estado        ENUM('programada','confirmada','cancelada','completada') NOT NULL DEFAULT 'programada',
  notas         TEXT,
  createdAt     DATETIME                                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME                                          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY citas_medico_fecha_idx (medico_id, fecha_hora),
  KEY citas_paciente_idx     (paciente_id),
  CONSTRAINT fk_cita_paciente   FOREIGN KEY (paciente_id)   REFERENCES pacientes (id),
  CONSTRAINT fk_cita_medico     FOREIGN KEY (medico_id)     REFERENCES usuarios  (id),
  CONSTRAINT fk_cita_secretaria FOREIGN KEY (secretaria_id) REFERENCES usuarios  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 11. ATENCIONES MÉDICAS
-- ────────────────────────────────────────────────────────────
CREATE TABLE atenciones_medicas (
  id                   INT            NOT NULL AUTO_INCREMENT,
  cita_id              INT            NOT NULL,
  paciente_id          INT            NOT NULL,
  medico_id            INT            NOT NULL,
  presion_sistolica    INT            DEFAULT NULL,
  presion_diastolica   INT            DEFAULT NULL,
  frecuencia_cardiaca  INT            DEFAULT NULL,
  temperatura          DECIMAL(4,1)   DEFAULT NULL,
  peso                 DECIMAL(5,2)   DEFAULT NULL,
  talla                DECIMAL(5,2)   DEFAULT NULL,
  saturacion_oxigeno   INT            DEFAULT NULL,
  motivo_consulta      TEXT           NOT NULL,
  anamnesis            TEXT,
  examen_fisico        TEXT,
  diagnostico          TEXT           NOT NULL,
  cie10                VARCHAR(10)    DEFAULT NULL,
  plan_tratamiento     TEXT,
  indicaciones         TEXT,
  createdAt            DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt            DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY atenciones_cita_uq    (cita_id),
  KEY atenciones_paciente_idx      (paciente_id),
  KEY atenciones_medico_idx        (medico_id),
  CONSTRAINT fk_aten_cita      FOREIGN KEY (cita_id)     REFERENCES citas    (id),
  CONSTRAINT fk_aten_paciente  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  CONSTRAINT fk_aten_medico    FOREIGN KEY (medico_id)   REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 12. RECETAS
-- ────────────────────────────────────────────────────────────
CREATE TABLE recetas (
  id            INT      NOT NULL AUTO_INCREMENT,
  atencion_id   INT      NOT NULL,
  paciente_id   INT      NOT NULL,
  medico_id     INT      NOT NULL,
  observaciones TEXT,
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY recetas_atencion_uq  (atencion_id),
  KEY recetas_paciente_idx        (paciente_id),
  KEY recetas_medico_idx          (medico_id),
  CONSTRAINT fk_rec_atencion  FOREIGN KEY (atencion_id) REFERENCES atenciones_medicas(id),
  CONSTRAINT fk_rec_paciente  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  CONSTRAINT fk_rec_medico    FOREIGN KEY (medico_id)   REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 13. RECETA ITEMS
-- ────────────────────────────────────────────────────────────
CREATE TABLE receta_items (
  id           INT          NOT NULL AUTO_INCREMENT,
  receta_id    INT          NOT NULL,
  medicamento  VARCHAR(200) NOT NULL,
  dosis        VARCHAR(100) DEFAULT NULL,
  frecuencia   VARCHAR(100) DEFAULT NULL,
  duracion     VARCHAR(100) DEFAULT NULL,
  indicaciones TEXT,
  PRIMARY KEY (id),
  KEY receta_items_receta_idx (receta_id),
  CONSTRAINT fk_item_receta FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 14. MEDICAMENTOS (catálogo)
-- ────────────────────────────────────────────────────────────
CREATE TABLE medicamentos (
  id               INT          NOT NULL AUTO_INCREMENT,
  numero_registro  VARCHAR(30)  NOT NULL,
  nombre           VARCHAR(300) NOT NULL,
  activo           TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY med_registro_uq (numero_registro),
  KEY med_nombre_idx (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 15. AGENDA BLOQUEOS
-- ────────────────────────────────────────────────────────────
CREATE TABLE agenda_bloqueos (
  id           INT                        NOT NULL AUTO_INCREMENT,
  medico_id    INT                        NOT NULL,
  fecha_inicio DATE                       NOT NULL,
  fecha_fin    DATE                       NOT NULL,
  tipo         ENUM('bloqueo','liberacion') NOT NULL,
  motivo       VARCHAR(255)               DEFAULT NULL,
  createdAt    DATETIME                   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt    DATETIME                   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY agenda_bloqueos_medico_fechas_idx (medico_id, fecha_inicio, fecha_fin),
  CONSTRAINT fk_bloqueo_medico FOREIGN KEY (medico_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  SEED DATA
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Especialidades
-- ────────────────────────────────────────────────────────────
INSERT INTO especialidades (nombre, activo) VALUES
  ('Medicina General',    1),
  ('Cardiología',         1),
  ('Pediatría',           1),
  ('Traumatología',       1),
  ('Neurología',          1),
  ('Ginecología',         1),
  ('Oftalmología',        1),
  ('Dermatología',        1),
  ('Psiquiatría',         1),
  ('Endocrinología',      1);

-- ────────────────────────────────────────────────────────────
-- Subespecialidades
-- ────────────────────────────────────────────────────────────
INSERT INTO subespecialidades (especialidad_id, nombre, activo) VALUES
  (2, 'Cardiología Intervencional',  1),
  (2, 'Insuficiencia Cardíaca',      1),
  (3, 'Neonatología',                1),
  (3, 'Pediatría Cardiológica',      1),
  (5, 'Neurología Vascular',         1),
  (5, 'Epilepsia',                   1),
  (6, 'Medicina Materno-Fetal',      1),
  (9, 'Psicogeriatría',              1);

-- ────────────────────────────────────────────────────────────
-- Previsiones
-- ────────────────────────────────────────────────────────────
INSERT INTO previsiones (nombre, tipo, activo) VALUES
  ('FONASA A',        'fonasa', 1),
  ('FONASA B',        'fonasa', 1),
  ('FONASA C',        'fonasa', 1),
  ('FONASA D',        'fonasa', 1),
  ('Banmédica',       'isapre', 1),
  ('Colmena',         'isapre', 1),
  ('Cruz Blanca',     'isapre', 1),
  ('Consalud',        'isapre', 1),
  ('Vida Tres',       'isapre', 1),
  ('Nueva Masvida',   'isapre', 1);

-- ────────────────────────────────────────────────────────────
-- Usuarios
--   id 1  → admin
--   id 2  → Dr. Carlos Mendoza (Medicina General)
--   id 3  → Dra. Ana Rodríguez (Cardiología)
--   id 4  → Secretaria Laura Fuentes
--   id 5  → Secretaria Jorge Pérez
-- ────────────────────────────────────────────────────────────
INSERT INTO usuarios (nombre, apellido, rut, telefono, email, password, rol, activo, createdAt, updatedAt) VALUES
  -- Admin
  ('Administrador', 'Sistema',    '11111111-1', '+56912345678',
   'admin@consulta.cl',
   '$2a$10$uxHxZdbQUMtOjlRrVxQTaun6UGdoVcr0aeAmhgaOCtg8jx.eVSGJy',
   'admin', 1, NOW(), NOW()),

  -- Médico 1
  ('Carlos', 'Mendoza Araya',     '12345678-9', '+56911111111',
   'carlos.mendoza@consulta.cl',
   '$2a$10$JQWhqRZg.k.5l8Hcvnjtb.1sZ1RnyMtEOsCeqUWz9hncHGj2Jc/RS',
   'medico', 1, NOW(), NOW()),

  -- Médico 2
  ('Ana', 'Rodríguez Vega',       '98765432-1', '+56922222222',
   'ana.rodriguez@consulta.cl',
   '$2a$10$JQWhqRZg.k.5l8Hcvnjtb.1sZ1RnyMtEOsCeqUWz9hncHGj2Jc/RS',
   'medico', 1, NOW(), NOW()),

  -- Secretaria 1
  ('Laura', 'Fuentes Torres',     '13579246-8', '+56933333333',
   'laura.fuentes@consulta.cl',
   '$2a$10$YYbAGTYmd21n9JTgs71UfO9EVbJ50COrNQpmf45MikTYQGYAWhYF.',
   'secretaria', 1, NOW(), NOW()),

  -- Secretaria 2
  ('Jorge', 'Pérez Soto',         '24681357-K', '+56944444444',
   'jorge.perez@consulta.cl',
   '$2a$10$YYbAGTYmd21n9JTgs71UfO9EVbJ50COrNQpmf45MikTYQGYAWhYF.',
   'secretaria', 1, NOW(), NOW());

-- ────────────────────────────────────────────────────────────
-- Perfiles médicos
-- ────────────────────────────────────────────────────────────
INSERT INTO medicos_perfil
  (usuario_id, numero_registro, fecha_registro_prestador, titulo_profesional,
   especialidad_id, entidad_certificadora, vigencia_especialidad,
   direccion_consulta, telefono_consulta, descripcion,
   modalidad_presencial, modalidad_telemedicina,
   acepta_isapre, acepta_fonasa, acepta_particular, valor_particular,
   createdAt, updatedAt)
VALUES
  -- Dr. Mendoza → Medicina General (esp id 1)
  (2, 'REG-001-2018', '2018-03-15', 'Médico Cirujano',
   1, 'Pontificia Universidad Católica de Chile', '2028-03-15',
   'Av. Providencia 1234, Of. 301, Santiago', '+56224567890',
   'Médico general con 10 años de experiencia en atención primaria y urgencias.',
   1, 1,
   1, 1, 1, 45000,
   NOW(), NOW()),

  -- Dra. Rodríguez → Cardiología (esp id 2)
  (3, 'REG-002-2015', '2015-07-20', 'Médico Cirujano, Especialista en Cardiología',
   2, 'Universidad de Chile', '2025-07-20',
   'Clínica Las Condes, Estoril 450, Of. 712, Las Condes', '+56224891234',
   'Cardióloga con subespecialidad en insuficiencia cardíaca y cardiología intervencional.',
   1, 0,
   1, 1, 1, 75000,
   NOW(), NOW());

-- Médico-subespecialidades
INSERT INTO medico_subespecialidades (medico_id, subespecialidad_id) VALUES
  (3, 1), -- Dra. Rodríguez → Cardiología Intervencional
  (3, 2); -- Dra. Rodríguez → Insuficiencia Cardíaca

-- Médico-previsiones
INSERT INTO medico_previsiones (medico_id, prevision_id) VALUES
  (2, 1),(2, 2),(2, 3),(2, 4),(2, 5),(2, 6),  -- Dr. Mendoza: FONASA A-D + Banmédica + Colmena
  (3, 1),(3, 2),(3, 3),(3, 4),(3, 5),(3, 6),(3, 7),(3, 8); -- Dra. Rodríguez: todos

-- Secretaria → médico
INSERT INTO secretaria_medico (secretaria_id, medico_id) VALUES
  (4, 2), -- Laura atiende a Dr. Mendoza
  (4, 3), -- Laura también a Dra. Rodríguez
  (5, 2); -- Jorge también a Dr. Mendoza

-- ────────────────────────────────────────────────────────────
-- Pacientes
-- ────────────────────────────────────────────────────────────
INSERT INTO pacientes
  (nombre, apellido, rut, fecha_nacimiento, genero, telefono, email,
   direccion, ciudad,
   prevision_salud, nombre_isapre, numero_fonasa,
   prevision_social, nombre_afp,
   grupo_sanguineo, alergias, antecedentes,
   contacto_emergencia_nombre, contacto_emergencia_telefono,
   activo, createdAt, updatedAt)
VALUES
  ('Pedro',    'González Muñoz',   '15243648-7', '1980-04-12', 'masculino',
   '+56955111222', 'pedro.gonzalez@mail.cl',
   'Los Alamos 456, Ñuñoa', 'Santiago',
   'fonasa', NULL, 'FONASA-B-001',
   'afp', 'Habitat',
   'O+', 'Penicilina', 'Hipertensión arterial, DM tipo 2',
   'María González', '+56955333444',
   1, NOW(), NOW()),

  ('Carmen',   'López Vera',       '16354759-8', '1975-09-23', 'femenino',
   '+56966222333', 'carmen.lopez@mail.cl',
   'Av. Grecia 789, Macul', 'Santiago',
   'isapre', 'Banmédica', NULL,
   'afp', 'AFP Capital',
   'A+', NULL, 'Asma bronquial leve',
   'Roberto López', '+56966444555',
   1, NOW(), NOW()),

  ('Roberto',  'Silva Castro',     '17465860-9', '1990-01-05', 'masculino',
   '+56977333444', 'roberto.silva@mail.cl',
   'Calle Larga 321, Peñalolén', 'Santiago',
   'fonasa', NULL, 'FONASA-C-002',
   'ninguna', NULL,
   'B+', 'Sulfas', NULL,
   'Ana Silva', '+56977555666',
   1, NOW(), NOW()),

  ('Valentina','Morales Pino',     '18576971-0', '1995-07-18', 'femenino',
   '+56988444555', 'valentina.morales@mail.cl',
   'Vicuña Mackenna 1500, La Florida', 'Santiago',
   'isapre', 'Consalud', NULL,
   'afp', 'Provida',
   'AB-', 'Ibuprofeno', NULL,
   'Luis Morales', '+56988666777',
   1, NOW(), NOW()),

  ('Marcelo',  'Torres Reyes',     '19687082-1', '1965-11-30', 'masculino',
   '+56999555666', 'marcelo.torres@mail.cl',
   'Tocornal 220, Santiago Centro', 'Santiago',
   'fonasa', NULL, 'FONASA-D-003',
   'ips', NULL,
   'O-', NULL, 'EPOC, Tabaquismo 20 años (cesó 2018)',
   'Sandra Torres', '+56999777888',
   1, NOW(), NOW()),

  ('Sofía',    'Rojas Herrera',    '20798193-2', '2001-03-14', 'femenino',
   '+56900666777', 'sofia.rojas@mail.cl',
   'Pedro de Valdivia 890, Providencia', 'Santiago',
   'particular', NULL, NULL,
   'ninguna', NULL,
   'A-', NULL, NULL,
   'Patricia Herrera', '+56900888999',
   1, NOW(), NOW()),

  ('Luis',     'Vargas Arce',      '21809204-3', '1958-06-08', 'masculino',
   '+56911777888', 'luis.vargas@mail.cl',
   'Huérfanos 1480, Santiago Centro', 'Santiago',
   'fonasa', NULL, 'FONASA-A-004',
   'ips', NULL,
   'B-', 'AINEs', 'Insuficiencia cardíaca compensada, FA crónica',
   'Rosa Arce', '+56911999000',
   1, NOW(), NOW());

-- ────────────────────────────────────────────────────────────
-- Medicamentos (catálogo básico)
-- ────────────────────────────────────────────────────────────
INSERT INTO medicamentos (numero_registro, nombre, activo) VALUES
  ('F-001','Enalapril 10 mg comprimido',1),
  ('F-002','Losartán 50 mg comprimido',1),
  ('F-003','Atenolol 50 mg comprimido',1),
  ('F-004','Amlodipino 5 mg comprimido',1),
  ('F-005','Metformina 850 mg comprimido',1),
  ('F-006','Glibenclamida 5 mg comprimido',1),
  ('F-007','Insulina NPH 100 UI/mL inyectable',1),
  ('F-008','Salbutamol 100 mcg/dosis aerosol',1),
  ('F-009','Fluticasona 250 mcg/dosis aerosol',1),
  ('F-010','Amoxicilina 500 mg cápsula',1),
  ('F-011','Azitromicina 500 mg comprimido',1),
  ('F-012','Ciprofloxacino 500 mg comprimido',1),
  ('F-013','Omeprazol 20 mg cápsula',1),
  ('F-014','Ranitidina 150 mg comprimido',1),
  ('F-015','Paracetamol 500 mg comprimido',1),
  ('F-016','Ibuprofeno 400 mg comprimido',1),
  ('F-017','Ketorolaco 10 mg comprimido',1),
  ('F-018','Tramadol 50 mg cápsula',1),
  ('F-019','Loratadina 10 mg comprimido',1),
  ('F-020','Cetirizina 10 mg comprimido',1),
  ('F-021','Sertralina 50 mg comprimido',1),
  ('F-022','Fluoxetina 20 mg cápsula',1),
  ('F-023','Clonazepam 0,5 mg comprimido',1),
  ('F-024','Alprazolam 0,5 mg comprimido',1),
  ('F-025','Levotiroxina 50 mcg comprimido',1),
  ('F-026','Prednisona 5 mg comprimido',1),
  ('F-027','Metotrexato 2,5 mg comprimido',1),
  ('F-028','Atorvastatina 20 mg comprimido',1),
  ('F-029','Simvastatina 20 mg comprimido',1),
  ('F-030','Espironolactona 25 mg comprimido',1),
  ('F-031','Furosemida 40 mg comprimido',1),
  ('F-032','Digoxina 0,25 mg comprimido',1),
  ('F-033','Warfarina 5 mg comprimido',1),
  ('F-034','Aspirina 100 mg comprimido',1),
  ('F-035','Clopidogrel 75 mg comprimido',1);

-- ────────────────────────────────────────────────────────────
-- Citas (pasadas = completadas, futuras = programadas)
-- ────────────────────────────────────────────────────────────
-- cita 1: Pedro con Dr. Mendoza (completada)
INSERT INTO citas (paciente_id, medico_id, secretaria_id, fecha_hora, duracion_min, motivo, estado, notas, createdAt, updatedAt) VALUES
  (1, 2, 4, '2026-04-10 09:00:00', 30, 'Control hipertensión y diabetes',  'completada', NULL, NOW(), NOW()),
  (1, 2, 4, '2026-04-25 10:30:00', 30, 'Control post-exámenes',             'completada', NULL, NOW(), NOW()),
  (2, 3, 4, '2026-04-14 11:00:00', 45, 'Dolor precordial y disnea',         'completada', NULL, NOW(), NOW()),
  (3, 2, 5, '2026-04-17 08:30:00', 30, 'Infección respiratoria alta',       'completada', NULL, NOW(), NOW()),
  (5, 2, 4, '2026-04-22 09:30:00', 30, 'Control EPOC mensual',              'completada', NULL, NOW(), NOW()),
  (7, 3, 4, '2026-04-28 10:00:00', 45, 'Descompensación ICC',               'completada', NULL, NOW(), NOW()),
  (4, 2, 5, '2026-05-05 08:00:00', 30, 'Cefalea recurrente',                'completada', NULL, NOW(), NOW()),
  (6, 2, 4, '2026-05-08 09:00:00', 30, 'Control de rutina',                 'completada', NULL, NOW(), NOW()),
  -- Futuras
  (1, 2, 4, '2026-05-22 09:00:00', 30, 'Control trimestral HTA-DM',         'programada', NULL, NOW(), NOW()),
  (2, 3, 4, '2026-05-23 11:00:00', 45, 'Control Holter de 24 horas',        'confirmada', NULL, NOW(), NOW()),
  (3, 2, 5, '2026-05-26 08:30:00', 30, 'Control post-tratamiento',          'programada', NULL, NOW(), NOW()),
  (4, 2, 5, '2026-06-02 10:00:00', 30, 'Cefalea — seguimiento',             'programada', NULL, NOW(), NOW()),
  (5, 2, 4, '2026-06-05 09:30:00', 30, 'Control EPOC',                      'programada', NULL, NOW(), NOW()),
  (6, 2, 4, '2026-06-10 08:00:00', 30, 'Chequeo anual',                     'programada', NULL, NOW(), NOW());

-- ────────────────────────────────────────────────────────────
-- Atenciones médicas (para citas completadas)
-- ────────────────────────────────────────────────────────────
-- Atención 1: Pedro — HTA + DM2 (cita 1)
INSERT INTO atenciones_medicas
  (cita_id, paciente_id, medico_id,
   presion_sistolica, presion_diastolica, frecuencia_cardiaca, temperatura, peso, talla, saturacion_oxigeno,
   motivo_consulta, anamnesis, examen_fisico, diagnostico, cie10, plan_tratamiento, indicaciones,
   createdAt, updatedAt)
VALUES
  (1, 1, 2,
   148, 92, 74, 36.5, 88.50, 1.72, 97,
   'Control de hipertensión arterial y diabetes mellitus tipo 2.',
   'Paciente masculino 46 años con antecedente de HTA y DM2 de 5 años de evolución. Refiere buena adherencia a tratamiento. Glicemia en ayunas 142 mg/dL la semana pasada. Presión en casa 145/90 promedio.',
   'PA: 148/92 mmHg bilateral. FC: 74 lpm, regular. Peso: 88.5 kg, IMC 29.9. Sin edemas. Examen cardiopulmonar normal. Fondo de ojo no realizado.',
   'Hipertensión arterial esencial, no controlada. Diabetes mellitus tipo 2 descompensada leve.',
   'I10', 'Ajuste de enalapril a 20 mg/día. Mantener metformina 850 mg c/12h. Dieta hiposódica e hipoglucídica estricta. Control en 3 semanas con HbA1c y creatinina.',
   'Tomar la presión en casa dos veces al día, anotar los valores. Evitar sal en las comidas. Caminar 30 minutos mínimo 5 días a la semana. Acudir a urgencias si PA > 180/110.',
   NOW(), NOW()),

  -- Atención 2: Pedro — control post-exámenes (cita 2)
  (2, 1, 2,
   138, 86, 72, 36.4, 87.80, 1.72, 98,
   'Control con resultados de HbA1c y función renal.',
   'Paciente trae exámenes: HbA1c 7.8%, creatinina 0.9 mg/dL, microalbuminuria negativa. Refiere leve mejoría de glicemias en casa (120-150). PA en casa 135-138/85-88.',
   'PA: 138/86. FC: 72. Sin edemas. Peso 87.8 kg.',
   'HTA en mejor control. DM2 con HbA1c en meta parcial (objetivo <7%).',
   'E11', 'Mantener esquema actual. Agregar Atorvastatina 20 mg/noche. Control en 3 meses.',
   'Continuar dieta. Incorporar estatina en la noche. Repetir exámenes en 3 meses.',
   NOW(), NOW()),

  -- Atención 3: Carmen — cardio (cita 3)
  (3, 2, 3,
   130, 82, 88, 36.7, 64.00, 1.60, 96,
   'Dolor precordial opresivo y disnea a moderados esfuerzos de 2 semanas de evolución.',
   'Paciente femenina 50 años, asma bronquial leve en tratamiento. Refiere episodios de opresión torácica 4/10, sin irradiación, con disnea al subir escaleras. Sin síncope.',
   'PA: 130/82. FC: 88. SpO2: 96%. Auscultación cardíaca: R1-R2 normales, sin soplos. Murmullo vesicular conservado bilateral. Sin edemas.',
   'Síndrome coronario estable. Se solicita ECG y ecocardiograma para descartar cardiopatía isquémica.',
   'I25.9', 'ECG en reposo. Holter 24h. Ecocardiograma transtorácico. Inicio Aspirina 100 mg + Atenolol 25 mg. Control con resultados.',
   'Evitar esfuerzos intensos hasta tener resultados. Acudir a urgencias ante dolor torácico en reposo o mayor a 7/10.',
   NOW(), NOW()),

  -- Atención 4: Roberto — IRA (cita 4)
  (4, 3, 2,
   118, 76, 84, 37.8, 78.00, 1.78, 97,
   'Tos productiva, fiebre y odinofagia de 3 días de evolución.',
   'Paciente masculino 36 años, sin antecedentes relevantes. Fiebre máx 38.5°C. Tos con expectoración amarillenta. Odinofagia intensa. Sin dificultad respiratoria.',
   'Temperatura: 37.8°C. Faringe eritematosa con exudado purulento amigdalino bilateral. Adenopatías cervicales blandas. Pulmones sin alteraciones.',
   'Faringoamigdalitis aguda bacteriana. Test rápido estreptococo positivo.',
   'J03.0', 'Amoxicilina 500 mg cada 8 horas por 10 días. Paracetamol 1g cada 8 horas si fiebre o dolor. Reposo 3 días.',
   'Tomar el antibiótico completo aunque mejore antes. Líquidos abundantes. Gárgaras con agua tibia y sal. Consultar si no mejora en 48-72 horas.',
   NOW(), NOW()),

  -- Atención 5: Marcelo — EPOC (cita 5)
  (5, 5, 2,
   132, 84, 80, 36.6, 72.00, 1.70, 94,
   'Control mensual EPOC. El paciente refiere leve aumento de disnea en los últimos días.',
   'Paciente 60 años, EPOC moderado (GOLD II), exfumador. Usa Salbutamol PRN y Fluticasona inhalada. Refiere mayor disnea a pequeños esfuerzos, sin fiebre ni aumento de expectoración.',
   'FR: 18. SpO2: 94% aire ambiental. Murmullo vesicular disminuido en bases. Sibilancias dispersas espiratorias. Sin uso musculatura accesoria.',
   'EPOC moderado, exacerbación leve.',
   'J44.1', 'Salbutamol 2 puffs cada 4-6 horas x 7 días. Prednisona 40 mg/día x 5 días. Refuerzo técnica inhalatoria. Control en 7 días.',
   'Usar Salbutamol con espaciador. No suspender Fluticasona. Acudir a urgencias si SpO2 < 90% o disnea en reposo.',
   NOW(), NOW()),

  -- Atención 6: Luis — ICC (cita 6)
  (6, 7, 3,
   158, 96, 96, 36.8, 82.00, 1.68, 92,
   'Aumento de edemas en extremidades inferiores y disnea de reposo de 2 días.',
   'Paciente masculino 67 años, ICC con FE reducida (FE 35%), FA crónica en tratamiento. Refiere aumento de peso 3 kg en 4 días, disnea al acostarse, nicturia.',
   'PA: 158/96. FC: 96 irregular. SpO2: 92% aa. Ingurgitación yugular ++. Crepitaciones bibasales. Edema EEII +++. Hígado palpable 2 cm bajo reborde costal.',
   'Descompensación de insuficiencia cardíaca con FE reducida. Probable causa: exceso de sodio en dieta.',
   'I50.0', 'Furosemida 80 mg EV en urgencia. Ajuste Espironolactona 50 mg. Restricción hídrica 1.5L/día. Dieta hiposódica estricta. Control en 48h o antes si no mejora.',
   'Pesarse todos los días en ayunas. Consultar si gana >1 kg en 24h. Dieta sin sal agregada. No suspender ningún medicamento.',
   NOW(), NOW()),

  -- Atención 7: Valentina — cefalea (cita 7)
  (7, 4, 2,
   120, 78, 70, 36.5, 56.00, 1.63, 99,
   'Cefaleas frontales recurrentes 2-3 veces por semana, 2 meses de evolución.',
   'Paciente femenina 31 años, sin antecedentes. Cefalea frontal pulsátil 6/10 con fotofobia, sin náuseas ni vómitos. No interfiere con AVD. Relacionada a estrés laboral.',
   'Signos vitales normales. Examen neurológico: sin focalidad. Sin rigidez de nuca. Fondo de ojo diferido.',
   'Cefalea tensional crónica. Se descarta migraña sin aura.',
   'G44.2', 'Ibuprofeno 400 mg en crisis. Técnicas de relajación. Higiene del sueño. Derivar a psicología si no mejora. Evitar analgésicos >3 días/semana para prevenir rebote.',
   'Llevar diario de cefaleas (frecuencia, intensidad, gatillantes). Mantener horarios de sueño regulares. Actividad física regular.',
   NOW(), NOW()),

  -- Atención 8: Sofía — control rutina (cita 8)
  (8, 6, 2,
   112, 70, 68, 36.3, 52.00, 1.65, 99,
   'Control de salud anual. Sin molestias.',
   'Paciente femenina 25 años, sin antecedentes. Se presenta a chequeo preventivo. Niega tabaquismo, consumo de OH moderado ocasional. Actividad física 3x/semana.',
   'Normotensa. FC: 68 regular. IMC 19.1. Examen físico general normal. Mamas sin nódulos. Ginecológico diferido.',
   'Paciente sana. Sin hallazgos patológicos.',
   'Z00.0', 'Hemograma, perfil lipídico, glicemia, orina completa preventivos. PAP al día. Vacunación: revisar esquema adulto.',
   'Mantener estilo de vida saludable. Repetir chequeo en 1 año. Traer resultados de exámenes.',
   NOW(), NOW());

-- ────────────────────────────────────────────────────────────
-- Recetas
-- ────────────────────────────────────────────────────────────
INSERT INTO recetas (atencion_id, paciente_id, medico_id, observaciones, createdAt, updatedAt) VALUES
  (1, 1, 2, 'Paciente requiere control de PA en domicilio. Próxima HbA1c en 3 meses.', NOW(), NOW()),
  (2, 1, 2, 'Agregar estatina. Mantener antidiabéticos.', NOW(), NOW()),
  (3, 2, 3, 'Pendiente resultado Holter. Iniciar tratamiento antiisquémico preventivo.', NOW(), NOW()),
  (4, 3, 2, NULL, NOW(), NOW()),
  (5, 5, 2, 'Exacerbación leve EPOC. Reforzar técnica inhalatoria en próximo control.', NOW(), NOW()),
  (6, 7, 3, 'Descompensación ICC. Control estrecho. Coordinar con enfermería control de peso diario.', NOW(), NOW()),
  (7, 4, 2, NULL, NOW(), NOW());

-- ────────────────────────────────────────────────────────────
-- Receta Items
-- ────────────────────────────────────────────────────────────
-- Receta 1 — Pedro: HTA+DM
INSERT INTO receta_items (receta_id, medicamento, dosis, frecuencia, duracion, indicaciones) VALUES
  (1, 'Enalapril',    '20 mg',   'Cada 12 horas', '90 días',  'Tomar con agua, puede tomarse con o sin alimentos'),
  (1, 'Metformina',   '850 mg',  'Cada 12 horas', '90 días',  'Tomar con las comidas para disminuir efectos gastrointestinales'),
  (1, 'Aspirina',     '100 mg',  'Una vez al día','90 días',  'Tomar en las mañanas con desayuno');

-- Receta 2 — Pedro: agregar estatina
INSERT INTO receta_items (receta_id, medicamento, dosis, frecuencia, duracion, indicaciones) VALUES
  (2, 'Enalapril',      '20 mg',  'Cada 12 horas', '90 días', 'Mantener igual'),
  (2, 'Metformina',     '850 mg', 'Cada 12 horas', '90 días', 'Mantener igual'),
  (2, 'Atorvastatina',  '20 mg',  'Una vez al día','90 días', 'Tomar en la noche');

-- Receta 3 — Carmen: cardio
INSERT INTO receta_items (receta_id, medicamento, dosis, frecuencia, duracion, indicaciones) VALUES
  (3, 'Aspirina',  '100 mg', 'Una vez al día', '30 días', 'Tomar en las mañanas con alimentos'),
  (3, 'Atenolol',  '25 mg',  'Una vez al día', '30 días', 'No suspender bruscamente');

-- Receta 4 — Roberto: IRA
INSERT INTO receta_items (receta_id, medicamento, dosis, frecuencia, duracion, indicaciones) VALUES
  (4, 'Amoxicilina',  '500 mg', 'Cada 8 horas',  '10 días', 'Completar tratamiento aunque se sienta mejor. Tomar con alimentos'),
  (4, 'Paracetamol',  '1 g',    'Cada 8 horas',  '5 días',  'Solo si tiene fiebre o dolor. No exceder 4g/día');

-- Receta 5 — Marcelo: EPOC exacerbado
INSERT INTO receta_items (receta_id, medicamento, dosis, frecuencia, duracion, indicaciones) VALUES
  (5, 'Salbutamol 100 mcg/dosis aerosol', '2 puffs', 'Cada 4-6 horas', '7 días',  'Usar con espaciador. Agitar antes de usar'),
  (5, 'Prednisona',                       '40 mg',   'Una vez al día', '5 días',  'Tomar en las mañanas con alimentos. No suspender bruscamente');

-- Receta 6 — Luis: ICC descompensada
INSERT INTO receta_items (receta_id, medicamento, dosis, frecuencia, duracion, indicaciones) VALUES
  (6, 'Furosemida',      '80 mg',  'Cada 12 horas', '7 días',  'Monitorear peso diario. Si baja >2kg/día, reducir a 40mg'),
  (6, 'Espironolactona', '50 mg',  'Una vez al día', '30 días', 'Tomar en las mañanas'),
  (6, 'Digoxina',        '0.25 mg','Una vez al día', '30 días', 'No tomar si FC < 60 lpm'),
  (6, 'Warfarina',       '5 mg',   'Una vez al día', '30 días', 'Control INR en 7 días. No automedicar con AINEs');

-- Receta 7 — Valentina: cefalea
INSERT INTO receta_items (receta_id, medicamento, dosis, frecuencia, duracion, indicaciones) VALUES
  (7, 'Ibuprofeno', '400 mg', 'En crisis (máx 3 días/semana)', '30 días', 'Tomar con alimentos. No usar más de 3 veces por semana para evitar cefalea de rebote');

-- ────────────────────────────────────────────────────────────
-- Bloqueos de agenda
-- ────────────────────────────────────────────────────────────
INSERT INTO agenda_bloqueos (medico_id, fecha_inicio, fecha_fin, tipo, motivo, createdAt, updatedAt) VALUES
  (2, '2026-06-16', '2026-06-20', 'bloqueo',    'Vacaciones',                  NOW(), NOW()),
  (3, '2026-05-25', '2026-05-25', 'bloqueo',    'Congreso de Cardiología',     NOW(), NOW()),
  (2, '2026-07-14', '2026-07-14', 'liberacion', 'Jornada extra por demanda',   NOW(), NOW());

SET foreign_key_checks = 1;
