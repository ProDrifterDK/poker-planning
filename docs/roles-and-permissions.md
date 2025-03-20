# Roles y Permisos en Poker Planning Pro

Este documento describe el sistema de roles y permisos implementado en Poker Planning Pro, explicando las capacidades de cada rol y cómo gestionar los permisos en la aplicación.

## Índice

1. [Visión General](#visión-general)
2. [Roles Disponibles](#roles-disponibles)
3. [Matriz de Permisos](#matriz-de-permisos)
4. [Convertirse en Moderador](#convertirse-en-moderador)
5. [Gestión de Roles](#gestión-de-roles)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Preguntas Frecuentes](#preguntas-frecuentes)

## Visión General

Poker Planning Pro utiliza un sistema de roles para controlar quién puede realizar ciertas acciones dentro de una sala de planificación. Este sistema está diseñado para proporcionar la flexibilidad necesaria para diferentes estructuras de equipo, mientras se mantiene la integridad del proceso de estimación.

## Roles Disponibles

Actualmente, Poker Planning Pro ofrece dos roles principales:

### Moderador

El rol de Moderador está diseñado para los Scrum Masters, Product Owners o líderes de equipo que facilitan la sesión de Planning Poker.

**Características clave**:
- Control completo sobre la sesión de estimación
- Capacidad para gestionar issues y participantes
- Acceso a funciones administrativas

### Participante

El rol de Participante está diseñado para los miembros del equipo que contribuyen con sus estimaciones.

**Características clave**:
- Capacidad para votar en las estimaciones
- Visualización de resultados
- Participación en la sesión sin capacidades administrativas

## Matriz de Permisos

La siguiente tabla muestra las acciones que cada rol puede realizar:

| Acción | Moderador | Participante |
|--------|:---------:|:------------:|
| Crear sala | ✅ | ✅ |
| Unirse a sala | ✅ | ✅ |
| Votar | ✅ | ✅ |
| Ver estimaciones reveladas | ✅ | ✅ |
| Añadir issues | ✅ | ❌ |
| Editar issues | ✅ | ❌ |
| Seleccionar issue actual | ✅ | ❌ |
| Revelar estimaciones | ✅ | ❌ |
| Iniciar nueva votación | ✅ | ❌ |
| Cambiar serie de estimación | ✅ | ❌ |
| Expulsar participantes | ✅ | ❌ |
| Cambiar roles de otros | ✅ | ❌ |

## Convertirse en Moderador

Hay dos formas principales de obtener el rol de Moderador:

### 1. Crear una Sala

Cuando creas una nueva sala, automáticamente se te asigna el rol de Moderador.

### 2. Ser Promovido por un Moderador Existente

Un moderador existente puede promover a cualquier participante al rol de moderador:

1. El moderador accede a la lista de participantes
2. Hace clic en el icono de ajustes junto al nombre del participante
3. Selecciona "Promover a Moderador"
4. Confirma la acción

## Gestión de Roles

### Como Moderador

Como moderador, puedes gestionar los roles de los participantes en tu sala:

1. Accede a la lista de participantes desde el panel lateral
2. Junto a cada participante, verás un icono de ajustes (⚙️)
3. Haz clic en este icono para ver las opciones disponibles:
   - Promover a Moderador
   - Degradar a Participante
   - Expulsar de la sala

### Limitaciones

- No puedes degradarte a ti mismo si eres el único moderador en la sala
- No puedes expulsar a otros moderadores
- Los cambios de rol surten efecto inmediatamente

## Mejores Prácticas

Para una gestión efectiva de roles en tu equipo:

1. **Limita el número de moderadores**: Generalmente, solo 1-2 personas deberían tener el rol de moderador para evitar confusiones.

2. **Documenta quién tiene acceso**: Mantén un registro de quién tiene el rol de moderador.

3. **Rota el rol de moderador**: Considera rotar el rol de moderador entre los miembros del equipo para fomentar la participación y el aprendizaje.

4. **Establece guías claras**: Define cuándo y cómo se deben usar los permisos de moderador en tu equipo.

## Preguntas Frecuentes

### ¿Puedo tener más de un moderador en una sala?
Sí, una sala puede tener múltiples moderadores.

### ¿Qué sucede si todos los moderadores abandonan la sala?
La sala seguirá funcionando, pero nadie podrá realizar acciones administrativas hasta que un nuevo moderador se una.

### ¿Puedo personalizar los permisos para cada rol?
Actualmente no es posible personalizar los permisos individuales, pero estamos considerando esta característica para futuras versiones.

### ¿Los roles persisten entre sesiones?
Sí, una vez que se te asigna un rol en una sala específica, este rol persiste incluso si cierras y vuelves a abrir la aplicación.

### ¿Cómo puedo ver mi rol actual?
Tu rol actual se muestra en el menú de usuario en la esquina superior derecha de la aplicación.