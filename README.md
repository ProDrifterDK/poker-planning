# Poker Planning Pro

Una aplicación de planificación ágil para equipos de desarrollo que permite realizar sesiones de Planning Poker de forma colaborativa.

## Características

- Creación de salas de planificación con diferentes series de estimación (Fibonacci, T-shirt, Powers of 2, Days)
- Votación en tiempo real con múltiples participantes
- Revelación sincronizada de estimaciones
- Cálculo automático de promedios
- Sistema de roles (Moderador, Participante)
- Soporte para modo oscuro/claro
- Interfaz responsive para dispositivos móviles y de escritorio
- Temporizador para votaciones
- Sistema de suscripciones con planes Free, Pro y Enterprise
- Integración con PayPal para pagos

## Tecnologías Utilizadas

- **Frontend**: Next.js, React, TypeScript, Material UI
- **Backend**: Firebase Realtime Database
- **Autenticación**: Firebase Authentication
- **Despliegue**: Vercel

## Instalación y Ejecución Local

### Requisitos Previos

- Node.js (versión 18 o superior)
- npm o yarn
- Cuenta de Firebase (para la base de datos en tiempo real)

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

3. Instalar dependencias para el sistema de suscripciones:
   ```bash
   # Dar permisos de ejecución al script
   chmod +x install-dependencies.sh
   
   # Ejecutar el script
   ./install-dependencies.sh
   ```

4. Configurar variables de entorno:
   - Copia el archivo `.env.local.example` a `.env.local`
   - Completa las variables con tus credenciales de Firebase y PayPal
   
   ```
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://tu-proyecto.firebaseio.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id
   
   # PayPal (para sistema de suscripciones)
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=tu-client-id-de-paypal
   PAYPAL_CLIENT_SECRET=tu-client-secret-de-paypal
   NEXT_PUBLIC_PAYPAL_RETURN_URL=http://localhost:3000/settings/subscription/success
   NEXT_PUBLIC_PAYPAL_CANCEL_URL=http://localhost:3000/settings/subscription/cancel
   PAYPAL_WEBHOOK_ID=tu-webhook-id-de-paypal
   ```
   
   Para obtener las credenciales de PayPal:
   1. Crea una cuenta en [PayPal Developer](https://developer.paypal.com/)
   2. Crea una aplicación en el [Dashboard de desarrollador](https://developer.paypal.com/dashboard/applications/sandbox)
   3. Obtén el Client ID y Client Secret de tu aplicación
   4. Configura los webhooks para recibir notificaciones de eventos de suscripción
   
   ### Configuración de Planes de Suscripción en PayPal
   
   Para crear los productos y planes de suscripción en PayPal:
   
   1. Configura tus credenciales de PayPal en `scripts/.env`:
      ```
      PAYPAL_CLIENT_ID=tu_client_id_aqui
      PAYPAL_CLIENT_SECRET=tu_client_secret_aqui
      PAYPAL_ENVIRONMENT=sandbox
      ```
   
   2. Ejecuta el script de creación de planes:
      ```bash
      node scripts/create-paypal-plans.js
      ```
   
   3. El script creará los productos y planes en PayPal y mostrará los IDs generados
   
   4. Actualiza el objeto `PAYPAL_PLAN_IDS` en `src/lib/paypalSdk.ts` con los IDs generados
   
   Para más detalles, consulta la [documentación de creación de planes de PayPal](docs/paypal-create-plans-script.md).

5. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   yarn dev
   ```

6. Abrir [http://localhost:3000](http://localhost:3000) en tu navegador

## Uso de la Aplicación

### Crear una Sala

1. En la página principal, haz clic en "Crear Sala"
2. Selecciona la serie de estimación que deseas usar (Fibonacci, T-shirt, etc.)
3. Comparte el enlace generado con los miembros de tu equipo

### Unirse a una Sala

1. Utiliza el enlace compartido o ingresa el código de la sala en la página principal
2. Ingresa tu nombre para identificarte en la sesión

### Estimación

1. El moderador selecciona un issue para estimar
2. Cada participante selecciona una carta con su estimación
3. El moderador revela todas las estimaciones cuando todos han votado
4. Se muestra el promedio de las estimaciones
5. El moderador puede iniciar una nueva ronda de votación

## Roles y Permisos

- **Moderador**: Puede crear salas, añadir issues, revelar estimaciones e iniciar nuevas votaciones
- **Participante**: Puede unirse a salas y votar en las estimaciones

Para convertirse en moderador, consulta la [documentación de roles y permisos](docs/roles-and-permissions.md).

## Solución de Problemas

Si encuentras algún problema al usar la aplicación, consulta nuestra [guía de solución de problemas](docs/troubleshooting.md).

## Actualizaciones Recientes

### Versión 2.1.0

- **Script de Creación de Planes de PayPal**: Nueva herramienta para crear productos y planes de suscripción en PayPal programáticamente
- **Documentación Mejorada**: Guías detalladas para la configuración y solución de problemas con PayPal
- **Corrección de Errores en Suscripciones**: Solución al problema de "INVALID_PARAMETER_SYNTAX" en plan_id de PayPal
- **Optimización del Proceso de Suscripción**: Mejoras en la experiencia de usuario durante el proceso de suscripción

### Versión 2.0.0

- **Sistema de Suscripciones**: Implementación de planes Free, Pro y Enterprise con diferentes características
- **Integración con PayPal**: Procesamiento seguro de pagos para suscripciones
- **Temporizador para Votaciones**: Añadido temporizador configurable para limitar el tiempo de votación
- **Mejoras en la Sincronización**: Optimización de la sincronización en tiempo real entre participantes

### Versión 1.1.0

- **Identificación de Usuario Mejorada**: Implementación de un sistema robusto para identificar correctamente a los usuarios entre sesiones
- **Corrección de Series de Estimación**: Ahora todos los participantes ven la misma serie de estimación seleccionada al crear la sala
- **Manejo Mejorado de Errores**: Mejor gestión de errores de red y problemas con bloqueadores de anuncios
- **Experiencia Offline Parcial**: La aplicación ahora funciona parcialmente incluso cuando hay problemas de conexión

## Contribuir

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Haz fork del repositorio
2. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Haz push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
