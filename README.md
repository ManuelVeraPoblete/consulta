# Consulta Médica — Sistema de Gestión de Salud

Sistema web completo para la gestión de consultas médicas con cuatro roles de usuario: **Admin**, **Médico**, **Secretaria** y **Paciente**. Incluye IA agéntica por rol impulsada por la API de Claude (Anthropic).

Desarrollado con React + Vite (frontend), Node.js + Express + Sequelize (backend) y TiDB Cloud (MySQL-compatible) como base de datos.

---

## Roles y funcionalidades

| Rol        | Funcionalidades principales |
|------------|-----------------------------|
| **Admin**      | Gestión de usuarios, médicos, secretarias, pacientes, especialidades y bloqueos de agenda. Estadísticas operativas. Asistente IA con 14 herramientas de analytics. |
| **Médico**     | Agenda diaria, ficha de pacientes, atenciones médicas, recetas, órdenes de examen, borrador de consulta. Asistente clínico IA con 12 herramientas (alertas de alergias, interacciones, casos similares). |
| **Secretaria** | Gestión de citas (crear, reagendar, cancelar, confirmar masivo), búsqueda de pacientes, verificación de disponibilidad horaria. Asistente IA con 12 herramientas y confirmación de acciones destructivas. |
| **Paciente**   | Ver citas, historial médico, recetas, perfil clínico. Buscar médicos y verificar disponibilidad. Solicitar citas. Asistente IA con 10 herramientas y protocolo de emergencia (SAMU 131). |

---

## Stack tecnológico

### Frontend
- **React 18** con componentes funcionales y hooks
- **React Router v6** con protección de rutas por rol
- **Vite** como bundler/dev server
- **CSS Modules** para estilos encapsulados
- **Axios** con interceptores JWT automáticos
- **Context API** para estado global de autenticación

### Backend
- **Node.js + Express**
- **Sequelize ORM** con TiDB Cloud (MySQL-compatible)
- **JWT** (jsonwebtoken) — autenticación stateless
- **bcryptjs** — hash de contraseñas
- **@anthropic-ai/sdk** — IA agéntica con `tool_use` loop
- **dotenv** — variables de entorno

### Base de datos
- **TiDB Cloud** (MySQL 8-compatible) en producción
- MySQL 8 local para desarrollo

---

## IA Agéntica

Cada rol tiene un asistente de IA basado en el **loop agéntico de Claude** (`claude-sonnet-4-6`):

```
POST /api/agent/admin      → Asistente del administrador (14 tools)
POST /api/agent/secretary  → Asistente de secretaría (12 tools)
POST /api/agent/medico     → Asistente clínico del médico (12 tools)
POST /api/agent/patient    → Asistente de salud del paciente (10 tools)
```

### Patrón loop agéntico
```javascript
while (rounds < MAX_ROUNDS) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    tools: roleTools,
    messages: currentMessages,
  });
  if (response.stop_reason === 'end_turn') break;
  // ejecutar tools → agregar tool_result → repetir
}
```

### Seguridad de los agentes
- **ToolGuard**: `paciente_id`, `medico_id`, etc., **siempre** provienen del JWT, nunca del input del usuario.
- **IDOR prevention**: queries con `WHERE id = X AND paciente_id = {jwtId}`.
- **Secretaria**: `guardMedico()` verifica que el médico esté asignado a esa secretaria antes de operar.
- **Ley 20.584**: el agente admin no expone datos clínicos individuales.
- **Rate limiting paciente**: 20 req/usuario/hora (in-memory).
- **Protocolo de emergencia**: el agente paciente antepone "Llama al 131 (SAMU)" ante síntomas graves.

### Variable de entorno requerida
```env
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Estructura del proyecto

```
consulta/
├── backend/
│   └── src/
│       ├── config/
│       │   └── database.js                  # Conexión Sequelize/TiDB
│       ├── controllers/
│       │   ├── authController.js            # Login / register / profile
│       │   ├── adminController.js           # CRUD usuarios, médicos, pacientes
│       │   ├── agendaController.js          # Bloqueos, disponibilidad, slots
│       │   ├── citaController.js            # CRUD citas + solicitud de paciente
│       │   ├── medicoController.js          # Búsqueda médicos, dashboard, citas
│       │   ├── atencionController.js        # Atenciones médicas
│       │   ├── recetaController.js          # Recetas y sus ítems
│       │   ├── agentAdminController.js      # Agente IA admin (14 tools)
│       │   ├── agentSecretariaController.js # Agente IA secretaria (12 tools)
│       │   ├── agentMedicoController.js     # Agente IA médico (12 tools)
│       │   └── agentPacienteController.js   # Agente IA paciente (10 tools)
│       ├── middleware/
│       │   └── authMiddleware.js            # authenticate + authorize por rol
│       ├── models/
│       │   ├── index.js                     # Exportación y asociaciones
│       │   ├── User.js                      # Tabla usuarios (4 roles)
│       │   ├── MedicoPerfil.js              # Perfil médico, registro, convenios
│       │   ├── Especialidad.js
│       │   ├── Subespecialidad.js
│       │   ├── Paciente.js                  # Ficha de paciente (vinculada por RUT)
│       │   ├── Cita.js                      # programada/confirmada/cancelada/completada
│       │   ├── AtencionMedica.js            # Signos vitales, diagnóstico, CIE-10
│       │   ├── Receta.js
│       │   ├── RecetaItem.js
│       │   ├── Medicamento.js
│       │   ├── SecretariaMedico.js          # Tabla de asignación secretaria↔médico
│       │   └── AgendaBloqueo.js             # Bloqueos y liberaciones de agenda
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── adminRoutes.js
│       │   ├── medicoRoutes.js              # incluye GET /slots
│       │   ├── citaRoutes.js                # incluye POST /solicitud (paciente)
│       │   ├── atencionRoutes.js
│       │   ├── recetaRoutes.js
│       │   ├── pacienteRoutes.js
│       │   └── agentRoutes.js               # 4 endpoints agénticos
│       └── app.js
│
└── frontend/
    └── src/
        ├── components/
        │   ├── admin/
        │   │   ├── AdminSidebar.jsx
        │   │   └── tabs/
        │   │       ├── AgentChatPanel.jsx   # Chat IA reutilizable (todos los roles)
        │   │       ├── AgentChatPanel.module.css
        │   │       └── ...tabs del admin
        │   ├── medico/
        │   │   ├── MedicoSidebar.jsx
        │   │   └── tabs/...
        │   ├── secretaria/
        │   │   ├── SecretariaSidebar.jsx
        │   │   └── tabs/...
        │   └── paciente/
        │       ├── PacienteSidebar.jsx
        │       ├── MedicoAgenda.jsx         # Disponibilidad real + solicitud de cita
        │       └── tabs/...
        ├── pages/
        │   ├── AdminDashboard.jsx
        │   ├── MedicoDashboard.jsx
        │   ├── SecretariaDashboard.jsx
        │   └── PacienteDashboard.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── services/
        │   └── authService.js              # Axios con interceptores JWT
        └── App.jsx
```

---

## API REST — Endpoints principales

### Autenticación
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | Iniciar sesión | No |
| POST | `/api/auth/register` | Registrar usuario | No |
| GET | `/api/auth/profile` | Perfil del usuario actual | JWT |

### Médicos y agenda
| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/api/medicos/buscar` | Buscar médicos (filtros) | Todos |
| GET | `/api/medicos/especialidades` | Listar especialidades | Todos |
| GET | `/api/medicos/agenda/disponibilidad` | Disponibilidad de día | Todos |
| GET | `/api/medicos/slots` | Slots horarios libres por fecha | Todos |
| GET | `/api/medicos/agenda/estado` | Estado mensual de la agenda | médico/admin |
| POST | `/api/medicos/agenda/registro` | Crear bloqueo/liberación | médico/admin |

### Citas
| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/api/citas` | Listar citas | admin/secretaria |
| POST | `/api/citas` | Crear cita | admin/secretaria |
| PATCH | `/api/citas/:id/reagendar` | Reagendar cita | admin/secretaria |
| PATCH | `/api/citas/:id/cancelar` | Cancelar cita | admin/secretaria |
| POST | `/api/citas/solicitud` | Solicitar cita (vinculación por RUT) | paciente |

### Agentes IA
| Método | Ruta | Tools | Roles |
|--------|------|-------|-------|
| POST | `/api/agent/admin` | 14 | admin |
| POST | `/api/agent/secretary` | 12 | secretaria |
| POST | `/api/agent/medico` | 12 | medico |
| POST | `/api/agent/patient` | 10 | paciente |

---

## Seguridad implementada

- **SQL Injection**: parámetros siempre via Sequelize ORM (consultas parametrizadas)
- **XSS**: `helmet` con CSP en todos los endpoints
- **IDOR**: IDs sensibles siempre desde `req.user.id` (JWT), nunca del body/query
- **Autenticación**: JWT con firma HS256, expiración configurable
- **Contraseñas**: bcrypt con salt rounds 10, hooks Sequelize (nunca en texto plano)
- **CORS**: origen restringido al frontend desplegado
- **Rate limiting**: agente paciente limitado a 20 req/usuario/hora
- **Error leakage**: errores internos no exponen stack traces al cliente

---

## Vinculación Paciente ↔ Usuario

La tabla `pacientes` no tiene FK directa a `usuarios`. La vinculación se hace por RUT:

```javascript
// En agentPacienteController y citaController (POST /solicitud)
const paciente = await Paciente.findOne({ where: { rut: req.user.rut } });
```

El campo `rut` existe en ambas tablas (`usuarios.rut` y `pacientes.rut`).

---

## Instalación local

### Requisitos
- Node.js >= 18
- MySQL 5.7+ corriendo en `127.0.0.1:3306`
- Base de datos `consulta_medica` creada con todas las tablas
- Cuenta Anthropic con API key (para funciones IA)

### 1. Crear la base de datos (si no existe)
```sql
CREATE DATABASE IF NOT EXISTS consulta_medica
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

La app estará en `http://localhost:5173` y el backend en `http://localhost:5000`.

---

## Variables de entorno

### `backend/.env`
```env
# Base de datos MySQL local
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=consulta_medica
DB_USER=manuel
DB_PASSWORD=q1w2e3
DB_SSL=false

# JWT
JWT_SECRET=<secreto_largo_aleatorio>
JWT_EXPIRES_IN=2h

# IA agéntica (Anthropic) — requerida para los agentes
# ANTHROPIC_API_KEY=sk-ant-...

NODE_ENV=development
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Modelos de datos principales

```
usuarios          → id, nombre, apellido, rut, email, password, rol, activo
pacientes         → id, nombre, apellido, rut, fecha_nacimiento, prevision_salud, alergias, antecedentes, ...
medicos_perfil    → id, usuario_id (FK), especialidad_id, acepta_fonasa, acepta_isapre, valor_particular, ...
citas             → id, paciente_id, medico_id, secretaria_id (nullable), fecha_hora, estado, motivo
atenciones_medicas→ id, cita_id, paciente_id, medico_id, diagnostico, cie10, plan_tratamiento, signos_vitales
recetas           → id, atencion_id, paciente_id, medico_id, observaciones
receta_items      → id, receta_id, medicamento (texto), dosis, frecuencia, duracion
agenda_bloqueos   → id, medico_id, fecha_inicio, fecha_fin, tipo (bloqueo|liberacion)
secretaria_medico → secretaria_id, medico_id  (tabla de asignación)
```

---

## Scripts disponibles

### Backend
```bash
npm run dev    # Desarrollo con nodemon
npm start      # Producción
```

### Frontend
```bash
npm run dev      # Servidor de desarrollo Vite
npm run build    # Build de producción
npm run preview  # Previsualizar build
```
