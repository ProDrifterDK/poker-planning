# Guía de Usuario - Poker Planning Pro

Esta guía te ayudará a utilizar todas las funciones de Poker Planning Pro para realizar sesiones de Planning Poker efectivas con tu equipo.

## Índice

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Planes de Suscripción](#planes-de-suscripción)
4. [Crear una Sala](#crear-una-sala)
5. [Unirse a una Sala](#unirse-a-una-sala)
6. [Interfaz de la Sala](#interfaz-de-la-sala)
7. [Añadir Issues](#añadir-issues)
8. [Proceso de Votación](#proceso-de-votación)
9. [Roles y Permisos](#roles-y-permisos)
10. [Gestión de Perfil](#gestión-de-perfil)
11. [Exportación de Datos](#exportación-de-datos)
12. [Integraciones](#integraciones)
13. [Consejos y Mejores Prácticas](#consejos-y-mejores-prácticas)
14. [Preguntas Frecuentes](#preguntas-frecuentes)

## Introducción

Poker Planning Pro es una aplicación diseñada para facilitar las sesiones de Planning Poker en equipos ágiles. Permite a los equipos estimar el esfuerzo requerido para completar tareas o historias de usuario de manera colaborativa y en tiempo real.

### ¿Qué es Planning Poker?

Planning Poker es una técnica de estimación basada en consenso utilizada principalmente en metodologías ágiles. Los miembros del equipo utilizan cartas con valores para estimar el esfuerzo relativo de las tareas, lo que fomenta la discusión y ayuda a llegar a un entendimiento común.

## Primeros Pasos

Para comenzar a utilizar Poker Planning Pro, necesitas:

1. Un navegador web moderno (Chrome, Firefox, Safari, Edge)
2. Conexión a internet (aunque algunas funciones pueden trabajar offline)
3. Una cuenta (opcional, pero recomendada para funciones avanzadas)

## Planes de Suscripción

Poker Planning Pro ofrece tres planes de suscripción para adaptarse a diferentes necesidades:

### Plan Free (Gratuito)
- **Participantes por sala**: Hasta 5 participantes
- **Salas activas**: 1 sala
- **Características incluidas**:
  - Funcionalidades básicas de estimación
  - Temporizador para votación
  - Interfaz adaptable (tema claro/oscuro)
  - Múltiples series de estimación

### Plan Pro ($9.99/mes)
- **Participantes por sala**: Hasta 15 participantes
- **Salas activas**: 5 salas
- **Características adicionales**:
  - Todo lo incluido en el plan Free
  - Exportación de datos
  - Estadísticas avanzadas
  - Historial completo de estimaciones

### Plan Enterprise ($29.99/mes)
- **Participantes por sala**: Hasta 100 participantes
- **Salas activas**: 20 salas
- **Características adicionales**:
  - Todo lo incluido en el plan Pro
  - Integraciones con Jira, Trello y GitHub
  - Personalización de marca
  - Soporte prioritario

### Cómo Suscribirse

Para suscribirte a un plan de pago:

1. Inicia sesión en tu cuenta
2. Ve a "Configuración" > "Suscripción"
3. Selecciona el plan que deseas
4. Haz clic en "Suscribirse"
5. Completa el proceso de pago a través de PayPal
6. ¡Listo! Tu plan se actualizará inmediatamente

### Gestión de Suscripciones

Para gestionar tu suscripción:

1. Ve a "Configuración" > "Suscripción"
2. Aquí puedes:
   - Ver tu plan actual
   - Cambiar de plan
   - Cancelar tu suscripción
   - Ver el historial de pagos

## Crear una Sala

Para crear una nueva sala de Planning Poker:

1. En la página principal, haz clic en el botón "Crear Sala"
2. Selecciona la serie de estimación que deseas utilizar:
   - **Fibonacci**: 1, 2, 3, 5, 8, 13, 21, ?, ∞, ☕
   - **T-shirt**: XS, S, M, L, XL, XXL, ?, ∞, ☕
   - **Powers of 2**: 1, 2, 4, 8, 16, 32, ?, ∞, ☕
   - **Days**: 1d, 2d, 3d, 5d, 8d, ?, ∞, ☕
3. Haz clic en "Crear" para generar la sala
4. Comparte el enlace o código de sala con tu equipo

> **Nota**: Al crear una sala, automáticamente te conviertes en moderador con permisos adicionales.

## Unirse a una Sala

Para unirte a una sala existente:

1. Utiliza el enlace compartido por el creador de la sala, o
2. En la página principal, ingresa el código de la sala en el campo "Unirse a una Sala"
3. Ingresa tu nombre para identificarte en la sesión
4. Haz clic en "Unirse"

## Interfaz de la Sala

La interfaz de la sala de Planning Poker está dividida en varias secciones:

### Barra Superior
- Nombre de la sala y código para compartir
- Botón de tema claro/oscuro
- Menú de usuario

### Panel de Issues (Lateral)
- Lista de issues a estimar
- Botón para añadir nuevos issues
- Estado de cada issue (pendiente, estimado, omitido)

### Área Principal
- Issue actual seleccionado
- Cartas de estimación disponibles
- Participantes y sus estimaciones (cuando se revelan)
- Promedio de estimaciones

### Controles de Moderador
- Botón para revelar estimaciones
- Botón para iniciar nueva votación
- Botón para seleccionar issue actual

## Añadir Issues

Para añadir issues a estimar:

1. En el panel lateral, haz clic en "Añadir Issue"
2. Completa el formulario con:
   - **Clave**: Identificador único (ej. PROJ-123)
   - **Resumen**: Breve descripción del issue
3. Haz clic en "Guardar"

> **Nota**: Solo los moderadores pueden añadir issues.

## Proceso de Votación

El proceso de votación sigue estos pasos:

1. **Selección de Issue**: El moderador selecciona un issue para estimar
2. **Votación Individual**: Cada participante selecciona una carta que representa su estimación
   - Las cartas numéricas representan puntos de historia, días, o tamaño relativo
   - "?" significa "No tengo suficiente información"
   - "∞" significa "Esto es demasiado grande para estimarse"
   - "☕" sugiere "Necesitamos discutir esto durante un descanso"
3. **Revelación**: Cuando todos han votado, el moderador revela las estimaciones
4. **Discusión**: El equipo discute las diferencias en las estimaciones
5. **Nueva Votación**: Si es necesario, el moderador inicia una nueva ronda de votación
6. **Consenso**: Una vez alcanzado el consenso, se guarda la estimación final

## Roles y Permisos

Poker Planning Pro tiene dos roles principales:

### Moderador
- Puede crear salas
- Puede añadir y editar issues
- Puede seleccionar el issue actual
- Puede revelar estimaciones
- Puede iniciar nuevas votaciones

### Participante
- Puede unirse a salas existentes
- Puede votar en las estimaciones
- Puede ver las estimaciones una vez reveladas

Para más detalles sobre roles y cómo cambiar entre ellos, consulta la [documentación de roles y permisos](/docs/roles-and-permissions).

## Gestión de Perfil

### Acceder a tu Perfil

Para acceder a tu perfil de usuario:

1. Haz clic en tu avatar en la esquina superior derecha
2. Selecciona "Mi Perfil" en el menú desplegable

### Editar Información de Perfil

En la página de perfil puedes editar:

- Nombre de usuario
- Foto de perfil
- Correo electrónico
- Número de teléfono
- Cargo
- Empresa

Para cambiar tu foto de perfil:

1. Haz clic en el icono de cámara sobre tu avatar
2. Selecciona una imagen de tu dispositivo
3. La imagen se subirá y actualizará automáticamente

### Preferencias de Notificaciones

Para gestionar tus preferencias de notificaciones:

1. Ve a la sección "Notificaciones" en tu perfil
2. Activa o desactiva las opciones según tus preferencias:
   - Notificaciones por correo electrónico
   - Notificaciones push
   - Invitaciones a salas
   - Resumen semanal

## Exportación de Datos

> **Nota**: Esta característica está disponible solo para usuarios con planes Pro y Enterprise.

Para exportar datos de una sesión de Planning Poker:

1. Al finalizar una sesión de estimación, haz clic en el botón "Exportar Datos"
2. Selecciona el formato de exportación:
   - CSV
   - JSON
   - Excel
3. Elige qué datos incluir:
   - Resumen de estimaciones
   - Estimaciones individuales
   - Historial de votaciones
4. Haz clic en "Exportar" para descargar el archivo

Los datos exportados pueden utilizarse para:
- Integración con herramientas de gestión de proyectos
- Análisis histórico de estimaciones
- Informes para stakeholders

## Integraciones

> **Nota**: Esta característica está disponible solo para usuarios con plan Enterprise.

Poker Planning Pro ofrece integraciones con herramientas populares de gestión de proyectos:

### Integración con Jira

Para enviar estimaciones a Jira:

1. Configura la integración en "Configuración" > "Integraciones"
2. Conecta tu cuenta de Jira
3. Al finalizar una sesión de estimación, haz clic en "Enviar a Jira"
4. Selecciona el proyecto y el issue de Jira
5. La estimación se actualizará automáticamente en Jira

### Integración con Trello

Para enviar estimaciones a Trello:

1. Configura la integración en "Configuración" > "Integraciones"
2. Conecta tu cuenta de Trello
3. Al finalizar una sesión de estimación, haz clic en "Enviar a Trello"
4. Selecciona el tablero y la tarjeta de Trello
5. La estimación se añadirá como un comentario o etiqueta en la tarjeta

### Integración con GitHub

Para enviar estimaciones a GitHub:

1. Configura la integración en "Configuración" > "Integraciones"
2. Conecta tu cuenta de GitHub
3. Al finalizar una sesión de estimación, haz clic en "Enviar a GitHub"
4. Selecciona el repositorio y el issue de GitHub
5. La estimación se añadirá como un comentario en el issue

## Consejos y Mejores Prácticas

Para obtener el máximo beneficio de tus sesiones de Planning Poker:

- **Prepara los issues con anticipación**: Asegúrate de que todos los issues tengan descripciones claras
- **Establece una definición común**: Aclara qué significa cada valor de estimación para tu equipo
- **Limita el tiempo de discusión**: Establece un tiempo máximo para discutir cada issue
- **Enfócate en el tamaño relativo**: Planning Poker trata sobre el esfuerzo relativo, no sobre tiempo absoluto
- **Usa las primeras estimaciones como referencia**: Establece algunos issues de referencia para calibrar al equipo

## Preguntas Frecuentes

### Preguntas Generales

#### ¿Puedo usar Poker Planning Pro sin conexión a internet?
Parcialmente. La aplicación tiene algunas capacidades offline, pero para la sincronización completa entre participantes se requiere conexión a internet.

#### ¿Cuántos participantes pueden unirse a una sala?
El número máximo de participantes depende del plan de suscripción del creador de la sala:
- Plan Free: hasta 5 participantes
- Plan Pro: hasta 15 participantes
- Plan Enterprise: hasta 100 participantes

#### ¿Se guardan las estimaciones para uso futuro?
Sí, todas las estimaciones se guardan y pueden exportarse para su uso en otras herramientas (disponible en planes Pro y Enterprise).

#### ¿Cómo puedo reportar un problema o sugerir una mejora?
Puedes reportar problemas o sugerir mejoras a través de nuestro [repositorio de GitHub](https://github.com/ProDrifterDK/poker-planning).

### Preguntas sobre Suscripciones

#### ¿Puedo cambiar de plan en cualquier momento?
Sí, puedes actualizar o degradar tu plan en cualquier momento desde la página de suscripción.

#### ¿Qué métodos de pago aceptan?
Actualmente aceptamos pagos a través de PayPal, que permite pagar con tarjeta de crédito/débito o con saldo de PayPal.

#### ¿Ofrecen facturación?
Sí, generamos automáticamente facturas para todas las transacciones. Puedes acceder a ellas desde la sección "Historial de Pagos" en la página de suscripción.

#### ¿Hay descuentos para suscripciones anuales?
Actualmente estamos trabajando en planes anuales con descuento. Estarán disponibles próximamente.

#### ¿Qué sucede si cancelo mi suscripción?
Si cancelas tu suscripción, seguirás teniendo acceso a las características de tu plan hasta el final del período de facturación actual. Después, tu cuenta volverá automáticamente al plan Free.

#### ¿Puedo obtener un reembolso?
Evaluamos las solicitudes de reembolso caso por caso. Por favor, contacta a nuestro equipo de soporte si tienes algún problema con tu suscripción.

### Preguntas sobre Características

#### ¿Puedo personalizar las series de estimación?
Sí, todos los planes permiten seleccionar entre varias series de estimación predefinidas (Fibonacci, T-shirt, Powers of 2, Days).

#### ¿Puedo integrar Poker Planning Pro con JIRA u otras herramientas?
Las integraciones con Jira, Trello y GitHub están disponibles para usuarios con plan Enterprise.

#### ¿Puedo usar Poker Planning Pro en mi teléfono móvil?
Sí, la aplicación es completamente responsive y funciona en dispositivos móviles, tablets y desktops.

#### ¿Hay límite en el número de issues que puedo crear?
No hay límite en el número de issues que puedes crear en una sala, independientemente de tu plan de suscripción.