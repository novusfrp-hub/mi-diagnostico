# Plan Técnico: Sistema de Roles (RBAC), Autenticación Multi-Pestaña y Notificaciones Telegram
**Fecha:** 19 de Septiembre de 2026 - 20:15
**Plataforma:** Marshall Hardware Suite™ (MHS Pro) / Laboratorio Marshall Cell

---

## 1. Objetivos del Sistema

1. **Control de Acceso Basado en Roles (RBAC):**
   - **`super_admin` (Propietario - Marshall Cell):**
     - Control total: Gestión de usuarios (aprobar pendientes, asignar roles, suspender), creación/eliminación de marcas y modelos, edición de trazado vectorial de boardviews, calibración de presets, edición de pasos de diagnóstico e historial.
   - **`editor` (Técnico Senior / Partner de Confianza):**
     - Capacidad de autoría técnica: Añadir modelos, calcar pines y componentes SMD en boardviews, ingresar lecturas doradas de referencia, editar FPC y Docktest. No tiene acceso a administración de usuarios ni borrado de categorías maestras.
   - **`tecnico` (Técnico de Taller / Clientes / Amigos):**
     - Modo Diagnóstico y Medición: Consulta visual completa de todos los esquemas, boardviews Cara A / Cara B, buscador de Net Names, comparación en vivo con multímetro USB / manual contra valores de referencia.
     - **Seguridad:** No puede alterar coordenadas de pads, no puede borrar componentes ni sobreescribir la base de datos maestra.
   - **`pendiente` (Usuario Registrado en Espera):**
     - Pantalla de bienvenida indicando que su solicitud ha sido recibida y se encuentra pendiente de activación por Marshall Cell, con botón directo a WhatsApp.

2. **Módulo de Autenticación Unificado:**
   - Modal moderno con 3 pestañas:
     - `[ Iniciar Sesión ]`
     - `[ Registrarse ]` (Nombre, Taller, Teléfono, Email, Contraseña)
     - `[ Recuperar Contraseña ]` (Envío de enlace de recuperación mediante Firebase Auth)
   - Persistencia de sesión en tiempo real mediante `onAuthStateChanged` y sincronización con Firestore `usuarios/{uid}`.

3. **Flujo de Notificaciones y Aprobación por Telegram Bot:**
   - Endpoint API: `POST /api/notificar-telegram`
   - Al registrarse un nuevo usuario, el backend envía un mensaje con formato Markdown a Telegram con los datos del solicitante:
     - Nombre, Email, Nombre del Taller, Teléfono, UID, Fecha y Estado.
   - Configuración segura vía variables de entorno (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) con fallback tolerante a fallos si aún no se han configurado los tokens.

4. **Gestión de Usuarios para Super Admin:**
   - Panel visual dentro de la aplicación donde el Super Admin puede listar usuarios registrados, aprobar cuentas pendientes con 1 clic y conmutar roles entre Técnico y Editor.

---

## 2. Componentes y Archivos Afectados

- **`pages/api/notificar-telegram.js` [NUEVO]:**
  - Endpoint para despachar notificaciones al bot de Telegram del propietario.
- **`components/ModalAutenticacion.js` [NUEVO]:**
  - Modal autocontenido con diseño cyberpunk, pestañas de Login, Registro y Recuperación de Contraseña, validaciones y feedback de carga.
- **`pages/index.js` [MODIFICAR]:**
  - Integración del listener de autenticación `onAuthStateChanged`.
  - Estados `usuarioActual`, `perfilUsuario` (`rol`, `estado`).
  - Badge de rol en el header (`👑 Super Admin`, `🛠️ Editor`, `⚡ Técnico`).
  - Condicionales de permisos en botones de creación y edición (`+ Añadir Teléfono`, `+ Añadir Modelo`, `Guardar`).
  - Integración del modal de gestión de usuarios para el Super Admin.
- **`components/VisorMapeoPCB.js` [MODIFICAR]:**
  - Prop `puedeEditar`: Deshabilita herramientas de autoría (agregar pads, calcar, mover coordenadas, borrar) cuando el rol es `tecnico`.

---

## 3. Verificación
- Prueba de registro de nuevo usuario y validación de creación en Firebase Auth y Firestore.
- Prueba del endpoint de Telegram.
- Validación de que un usuario con rol `tecnico` tiene restringidas las herramientas de alteración de base de datos mientras mantiene funcionalidad completa de consulta e interactividad.
