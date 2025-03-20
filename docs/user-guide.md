# Guía de Usuario - Poker Planning Pro

Esta guía te ayudará a utilizar todas las funciones de Poker Planning Pro para realizar sesiones de Planning Poker efectivas con tu equipo.

## Índice

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Crear una Sala](#crear-una-sala)
4. [Unirse a una Sala](#unirse-a-una-sala)
5. [Interfaz de la Sala](#interfaz-de-la-sala)
6. [Añadir Issues](#añadir-issues)
7. [Proceso de Votación](#proceso-de-votación)
8. [Roles y Permisos](#roles-y-permisos)
9. [Consejos y Mejores Prácticas](#consejos-y-mejores-prácticas)
10. [Preguntas Frecuentes](#preguntas-frecuentes)

## Introducción

Poker Planning Pro es una aplicación diseñada para facilitar las sesiones de Planning Poker en equipos ágiles. Permite a los equipos estimar el esfuerzo requerido para completar tareas o historias de usuario de manera colaborativa y en tiempo real.

### ¿Qué es Planning Poker?

Planning Poker es una técnica de estimación basada en consenso utilizada principalmente en metodologías ágiles. Los miembros del equipo utilizan cartas con valores para estimar el esfuerzo relativo de las tareas, lo que fomenta la discusión y ayuda a llegar a un entendimiento común.

## Primeros Pasos

Para comenzar a utilizar Poker Planning Pro, necesitas:

1. Un navegador web moderno (Chrome, Firefox, Safari, Edge)
2. Conexión a internet (aunque algunas funciones pueden trabajar offline)
3. Una cuenta (opcional, pero recomendada para funciones avanzadas)

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

## Consejos y Mejores Prácticas

Para obtener el máximo beneficio de tus sesiones de Planning Poker:

- **Prepara los issues con anticipación**: Asegúrate de que todos los issues tengan descripciones claras
- **Establece una definición común**: Aclara qué significa cada valor de estimación para tu equipo
- **Limita el tiempo de discusión**: Establece un tiempo máximo para discutir cada issue
- **Enfócate en el tamaño relativo**: Planning Poker trata sobre el esfuerzo relativo, no sobre tiempo absoluto
- **Usa las primeras estimaciones como referencia**: Establece algunos issues de referencia para calibrar al equipo

## Preguntas Frecuentes

### ¿Puedo usar Poker Planning Pro sin conexión a internet?
Parcialmente. La aplicación tiene algunas capacidades offline, pero para la sincronización completa entre participantes se requiere conexión a internet.

### ¿Cuántos participantes pueden unirse a una sala?
No hay un límite estricto, pero recomendamos no más de 15 participantes para mantener sesiones efectivas.

### ¿Se guardan las estimaciones para uso futuro?
Sí, todas las estimaciones se guardan y pueden exportarse para su uso en otras herramientas.

### ¿Puedo integrar Poker Planning Pro con JIRA u otras herramientas?
Actualmente no ofrecemos integraciones directas, pero estamos trabajando en ello para futuras versiones.

### ¿Cómo puedo reportar un problema o sugerir una mejora?
Puedes reportar problemas o sugerir mejoras a través de nuestro [repositorio de GitHub](https://github.com/ProDrifterDK/poker-planning).