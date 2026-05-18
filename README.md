# Consulta Médica - Sistema de Gestión de Salud

Sistema web completo para la gestión de consultas médicas con tres roles de usuario: Médico, Secretaria y Paciente. Desarrollado con React (frontend), Node.js + Express (backend), Sequelize ORM y MySQL.

---

## Descripción del Sistema

**Consulta Médica** es una plataforma de salud digital que permite gestionar citas, historial médico y usuarios de una clínica u consultorio médico. El sistema implementa autenticación JWT con roles diferenciados, donde cada tipo de usuario accede a un dashboard personalizado con las funcionalidades relevantes para su rol.

### Funcionalidades principales

| Rol         | Acceso                                                                 |
|-------------|------------------------------------------------------------------------|
| Médico      | Ver agenda diaria, estadísticas de pacientes, historial de consultas   |
| Secretaria  | Gestionar y filtrar citas, ver estadísticas del consultorio            |
| Paciente    | Ver sus próximas citas y su historial médico personal                  |

---

## Stack Tecnológico

### Frontend
- **React 18** con componentes funcionales y hooks
- **React Router v6** para enrutamiento declarativo con protección de rutas
- **Vite** como bundler/dev server ultrarrápido
- **CSS Modules** para estilos encapsulados y sin colisiones
- **Axios** para llamadas HTTP con interceptores de autenticación
- **Context API** para gestión de estado global de autenticación

### Backend
- **Node.js** con **Express** como framework HTTP
- **Sequelize ORM** para abstracción de base de datos
- **MySQL 8** como motor de base de datos relacional
- **JWT** (jsonwebtoken) para autenticación stateless
- **bcryptjs** para hash seguro de contraseñas
- **dotenv** para manejo de variables de entorno

---

## Estructura del Proyecto

```
consulta/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # Conexión Sequelize/MySQL
│   │   ├── controllers/
│   │   │   └── authController.js    # Lógica de endpoints de autenticación
│   │   ├── middleware/
│   │   │   └── authMiddleware.js    # Verificación JWT y autorización por rol
│   │   ├── models/
│   │   │   ├── index.js             # Exportación de modelos y sync
│   │   │   └── User.js              # Modelo de usuario con hooks bcrypt
│   │   ├── routes/
│   │   │   └── authRoutes.js        # Definición de rutas de la API
│   │   ├── seeders/
│   │   │   └── seed.js              # Datos de prueba para los 3 roles
│   │   ├── services/
│   │   │   └── authService.js       # Lógica de negocio de autenticación
│   │   └── app.js                   # Entry point: Express + middlewares + inicio
│   ├── .env                         # Variables de entorno (no versionar)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Alert.jsx        # Componente de alertas reutilizable
│   │   │   │   ├── Button.jsx       # Botón con variantes, tamaños y spinner
│   │   │   │   └── Input.jsx        # Input con ícono, label y toggle password
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardLayout.jsx  # Layout común: header + nav + main
│   │   │   │   └── StatCard.jsx         # Tarjeta de estadística reutilizable
│   │   │   └── login/
│   │   │       ├── LoginForm.jsx    # Formulario de inicio de sesión
│   │   │       ├── LoginLeft.jsx    # Panel izquierdo animado con features
│   │   │       └── RegisterForm.jsx # Formulario de registro con selección de rol
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Contexto global: login, register, logout
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Página de login (dos columnas)
│   │   │   ├── MedicoDashboard.jsx  # Dashboard del médico
│   │   │   ├── SecretariaDashboard.jsx # Dashboard de la secretaria
│   │   │   └── PacienteDashboard.jsx   # Dashboard del paciente
│   │   ├── routes/
│   │   │   └── PrivateRoute.jsx     # HOC para proteger rutas por rol
│   │   ├── services/
│   │   │   └── authService.js       # Cliente Axios con interceptores JWT
│   │   ├── App.jsx                  # Árbol de rutas principal
│   │   ├── index.css                # Variables CSS globales y reset
│   │   └── main.jsx                 # Entry point React
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## Principios SOLID Aplicados

### S — Principio de Responsabilidad Única
Cada módulo tiene una única razón para cambiar:
- `authService.js` (backend): solo gestiona lógica de autenticación
- `authMiddleware.js`: solo valida tokens y permisos
- `AuthContext.jsx`: solo maneja el estado global de sesión
- `StatCard.jsx`: solo renderiza una tarjeta de estadística

### O — Principio Abierto/Cerrado
- El componente `Button` es extensible mediante props (`variant`, `size`, `icon`) sin modificar su código
- `DashboardLayout` acepta `children` y es reutilizable para todos los roles

### L — Principio de Sustitución de Liskov
- Todos los dashboards son intercambiables bajo `DashboardLayout`; cumplen el mismo contrato de componente hijo

### I — Principio de Segregación de Interfaces
- La API expone endpoints específicos por función (`/login`, `/register`, `/profile`)
- Los middlewares `authenticate` y `authorize` son independientes y componibles

### D — Principio de Inversión de Dependencias
- Los controladores dependen de `authService` (abstracción), no de la implementación de bcrypt/JWT directamente
- Los componentes React dependen del contexto (`useAuth`) en lugar de llamar a Axios directamente

---

## Instalación y Configuración

### Requisitos previos
- Node.js >= 18
- MySQL 8 ejecutándose localmente
- npm o yarn

### 1. Configurar la base de datos

```sql
CREATE DATABASE IF NOT EXISTS consulta_medica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> Las credenciales configuradas son: usuario `manuel`, contraseña `q1w2e3`

### 2. Instalar y arrancar el backend

```bash
cd backend
npm install
npm run dev        # Desarrollo con nodemon
# O: npm start    # Producción
```

El servidor se inicia en `http://localhost:5000` y sincroniza las tablas automáticamente con Sequelize.

### 3. Cargar datos de prueba

```bash
cd backend
npm run seed
```

Esto crea tres usuarios de prueba:

| Email                        | Contraseña     | Rol         |
|------------------------------|----------------|-------------|
| medico@consulta.com          | medico123      | Médico      |
| secretaria@consulta.com      | secretaria123  | Secretaria  |
| paciente@consulta.com        | paciente123    | Paciente    |

### 4. Instalar y arrancar el frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## API REST

### Endpoints disponibles

| Método | Ruta               | Descripción                          | Auth requerida |
|--------|--------------------|--------------------------------------|----------------|
| POST   | /api/auth/login    | Iniciar sesión                       | No             |
| POST   | /api/auth/register | Registrar nuevo usuario              | No             |
| GET    | /api/auth/profile  | Obtener perfil del usuario actual    | Sí (Bearer)    |
| GET    | /api/health        | Verificar estado del servidor        | No             |

### Ejemplo de login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"medico@consulta.com","password":"medico123"}'
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "user": {
    "id": 1,
    "nombre": "Carlos",
    "apellido": "Rodríguez",
    "email": "medico@consulta.com",
    "rol": "medico",
    "activo": true
  },
  "message": "Login exitoso"
}
```

---

## Seguridad

- **Contraseñas**: Hasheadas con bcrypt (salt rounds: 10) mediante hooks de Sequelize
- **Autenticación**: JWT con expiración configurable (por defecto 24h)
- **Autorización**: Middleware de roles que verifica el campo `rol` del token
- **CORS**: Configurado para aceptar solo el origen del frontend
- **Datos sensibles**: El campo `password` es eliminado del JSON de respuesta con `toJSON()`
- **Variables de entorno**: Credenciales y secretos en `.env` (nunca en el código)

---

## Diseño de la Interfaz

El login replica el diseño de la imagen de referencia:
- **Panel izquierdo**: Gradiente azul con imagen de fondo, tagline "Tu salud, nuestra prioridad", lista de características y badge de seguridad
- **Panel derecho**: Tarjeta blanca con logo, campos de email/contraseña con íconos, checkbox "Recordarme", botón de inicio de sesión y opción de crear cuenta

Cada dashboard tiene:
- Header con logo, nombre y rol del usuario, botón de cierre de sesión
- Grid de tarjetas de estadísticas con color único por rol
- Tablas y listados de información relevante al rol

---

## Variables de Entorno (backend/.env)

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=consulta_medica
DB_USER=manuel
DB_PASSWORD=q1w2e3
JWT_SECRET=consulta_medica_secret_2024
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

---

## Scripts disponibles

### Backend
```bash
npm run dev    # Desarrollo con hot-reload (nodemon)
npm start      # Producción
npm run seed   # Poblar base de datos con usuarios de prueba
```

### Frontend
```bash
npm run dev      # Servidor de desarrollo Vite (http://localhost:5173)
npm run build    # Build de producción
npm run preview  # Previsualizar build de producción
```
