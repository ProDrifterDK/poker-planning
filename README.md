# Poker Planning Pro

Una aplicación de planificación ágil para equipos de desarrollo que permite realizar sesiones de Planning Poker de forma colaborativa.

## Características

- Creación de salas de planificación con diferentes series de estimación (Fibonacci, T-shirt, Powers of 2, Days)
- Votación en tiempo real con múltiples participantes
- Revelación sincronizada de estimaciones y cálculo automático de promedios
- Sistema de roles (Moderador, Participante)
- Soporte para modo oscuro/claro
- Interfaz responsive para dispositivos móviles y de escritorio
- Temporizador para votaciones
- Suscripciones Free, Pro y Enterprise con límites de salas/participantes aplicados por backend
- Checkout de suscripciones con Stripe y PayPal a través del backend FastAPI en Railway

## Tecnologías Utilizadas

- **Frontend**: Next.js, React, TypeScript, Material UI
- **Tiempo real**: Firebase Realtime Database y Firestore para datos de salas autorizados por backend
- **Autenticación**: Firebase Authentication
- **Billing**: FastAPI en Railway como autoridad de planes, checkout, webhooks y suscripciones
- **Despliegue**: Vercel para frontend y Railway para backend de billing

## Instalación y Ejecución Local

### Requisitos Previos

- Node.js (versión 18 o superior)
- npm o yarn
- Cuenta de Firebase para autenticación y sincronización de salas
- Backend FastAPI de billing configurado localmente o una URL Railway accesible

### Pasos de Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/poker-planning-pro.git
   cd poker-planning-pro
   ```

2. Instalar dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

3. Configurar variables de entorno del frontend:
   - Copia `.env.example` a `.env.local`.
   - Completa las variables públicas de Firebase.
   - Apunta `NEXT_PUBLIC_BILLING_API_BASE_URL` al backend FastAPI de billing (local o Railway).
   - Deja `NEXT_PUBLIC_PAYPAL_ENABLED=false` hasta que Railway tenga PayPal configurado y desplegado.

   ```env
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://tu-proyecto.firebaseio.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id

   # Billing backend
   NEXT_PUBLIC_BILLING_API_BASE_URL=http://localhost:8000

   # PayPal solo controla visibilidad en UI; OAuth/planes/webhooks viven en Railway.
   NEXT_PUBLIC_PAYPAL_ENABLED=false
   ```

4. Configurar el backend de billing (Railway/FastAPI):
   - Usa `backend/.env.example` como contrato de variables.
   - Stripe requiere `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` y los `STRIPE_PRICE_*`.
   - PayPal requiere `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENVIRONMENT`, `PAYPAL_WEBHOOK_ID` y los `PAYPAL_PLAN_*`.
   - `BILLING_PROVIDER` define el proveedor por defecto cuando el frontend no envía uno; el frontend puede solicitar Stripe o PayPal explícitamente cuando ambos están habilitados.

5. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   yarn dev
   ```

6. Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

## Billing y compatibilidad legacy

El navegador ya no crea, confirma ni cancela suscripciones escribiendo documentos de Firebase ni usando SDKs de PayPal. El flujo activo es:

1. La UI llama al backend FastAPI (`NEXT_PUBLIC_BILLING_API_BASE_URL`).
2. El backend crea una sesión de checkout de Stripe o una aprobación de PayPal.
3. El proveedor confirma el pago por webhook o lookup server-side.
4. El backend actualiza la suscripción normalizada y la UI refresca `/v1/billing/me`.

Las rutas Next.js legacy bajo `/api/paypal/*` y `/api/webhooks/paypal` se conservan únicamente como tombstones HTTP 410 para evitar reactivar caminos antiguos. Las páginas estáticas `paypal-*.html` y `subscription-status.html` fueron eliminadas; los enlaces antiguos se redirigen a la página localizada de suscripción.

## Uso de la Aplicación

### Crear una Sala

1. En la página principal, haz clic en "Crear Sala".
2. Selecciona la serie de estimación que deseas usar (Fibonacci, T-shirt, Powers of 2, Days).
3. Comparte el enlace generado con los miembros de tu equipo.

### Unirse a una Sala

1. Utiliza el enlace compartido o ingresa el código de la sala en la página principal.
2. Ingresa tu nombre para identificarte en la sesión.

### Estimación

1. El moderador selecciona un issue para estimar.
2. Cada participante selecciona una carta con su estimación.
3. El moderador revela todas las estimaciones cuando todos han votado.
4. Se muestra el promedio de las estimaciones.
5. El moderador puede iniciar una nueva ronda de votación.

## Roles y Permisos

- **Moderador**: Puede crear salas, añadir issues, revelar estimaciones e iniciar nuevas votaciones.
- **Participante**: Puede unirse a salas y votar en las estimaciones.

Para convertirse en moderador, consulta la [documentación de roles y permisos](docs/roles-and-permissions.md).

## Solución de Problemas

Si encuentras algún problema al usar la aplicación, consulta nuestra [guía de solución de problemas](docs/troubleshooting.md).

## Actualizaciones Recientes

### Versión 2.2.0

- **Billing multi-proveedor**: Stripe y PayPal comparten el backend FastAPI/Railway como autoridad de checkout, webhooks y suscripciones.
- **Limpieza PayPal legacy**: Eliminadas páginas estáticas y componentes/SDK frontend de PayPal; las rutas antiguas devuelven HTTP 410 con explicación.
- **Documentación y envs actualizados**: README, guía de usuario y ejemplos de entorno describen Stripe + PayPal vía Railway.

### Versión 2.1.0

- **Backend de Billing**: Introducción del backend FastAPI para planes, suscripciones, pagos y webhooks.
- **Seguridad de Suscripciones**: El frontend dejó de crear documentos de billing directamente en Firebase.
- **Room Limits**: Los límites de salas y participantes se aplican en backend antes de proyectar estado a Firebase.

### Versión 2.0.0

- **Sistema de Suscripciones**: Implementación de planes Free, Pro y Enterprise con diferentes características.
- **Temporizador para Votaciones**: Añadido temporizador configurable para limitar el tiempo de votación.
- **Mejoras en la Sincronización**: Optimización de la sincronización en tiempo real entre participantes.

## Contribuir

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Haz fork del repositorio.
2. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`).
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`).
4. Haz push a la rama (`git push origin feature/amazing-feature`).
5. Abre un Pull Request.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
