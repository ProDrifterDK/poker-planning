# Solución de Problemas

## Problemas con Bloqueadores de Anuncios

Algunos usuarios han reportado problemas al usar la aplicación con bloqueadores de anuncios activados. Estos problemas pueden incluir:

- No poder seleccionar cartas después de iniciar una nueva votación
- Errores al revelar estimaciones
- Problemas de sincronización entre usuarios
- Mensajes de error en la consola del navegador

### ¿Por qué ocurre esto?

Los bloqueadores de anuncios modernos a veces bloquean solicitudes a servicios de Firebase, que es la plataforma que utilizamos para la comunicación en tiempo real y el almacenamiento de datos. Esto ocurre porque algunos bloqueadores de anuncios categorizan erróneamente estas solicitudes como rastreadores o análisis.

### Soluciones

Si experimentas estos problemas, tienes varias opciones:

#### 1. Desactivar temporalmente el bloqueador de anuncios

La solución más sencilla es desactivar temporalmente el bloqueador de anuncios mientras usas la aplicación:

- **uBlock Origin**: Haz clic en el icono de uBlock Origin y luego en el botón de encendido para desactivarlo en el sitio actual.
- **AdBlock Plus**: Haz clic en el icono de AdBlock Plus y selecciona "Pausar en este sitio".
- **Brave Browser**: Si usas Brave, puedes ajustar el nivel de protección haciendo clic en el icono del escudo y bajando el nivel de protección.

#### 2. Añadir una excepción para este sitio

Una mejor solución a largo plazo es añadir una excepción para este sitio en tu bloqueador de anuncios:

- **uBlock Origin**: 
  1. Haz clic en el icono de uBlock Origin
  2. Haz clic en el botón "Abrir el panel de control"
  3. Ve a la pestaña "Lista blanca"
  4. Añade el dominio de la aplicación y guarda los cambios

- **AdBlock Plus**:
  1. Haz clic en el icono de AdBlock Plus
  2. Selecciona "Sitio web de lista blanca"
  3. Confirma la acción

- **Brave Browser**:
  1. Haz clic en el icono del escudo
  2. Desactiva "Bloquear scripts" para este sitio

#### 3. Configurar excepciones específicas

Si prefieres mantener la protección general pero permitir solo las solicitudes necesarias:

1. Abre la consola del navegador (F12 o Ctrl+Shift+I)
2. Busca errores que contengan "ERR_BLOCKED_BY" o "failed to fetch"
3. Identifica los dominios bloqueados (generalmente firestore.googleapis.com o firebase.googleapis.com)
4. Añade estos dominios específicos a la lista blanca de tu bloqueador de anuncios

### Modo Offline

Si no puedes o no quieres modificar la configuración de tu bloqueador de anuncios, la aplicación seguirá funcionando en modo "offline". Esto significa que:

- Podrás seleccionar cartas y ver tus propias estimaciones
- Podrás revelar estimaciones localmente
- Podrás iniciar nuevas votaciones

Sin embargo, estos cambios no se sincronizarán con otros usuarios en la sala, lo que limita la funcionalidad colaborativa de la aplicación.

## Problemas con Suscripciones

### No puedo actualizar mi plan

Si tienes problemas al actualizar tu plan de suscripción:

1. Verifica que tu método de pago sea válido y tenga fondos suficientes
2. Asegúrate de que no hay restricciones en tu cuenta de PayPal
3. Intenta usar otro navegador o dispositivo
4. Limpia la caché y las cookies de tu navegador

### Mi pago fue procesado pero mi plan no se actualizó

Si realizaste un pago pero tu plan no se actualizó:

1. Espera unos minutos, a veces hay un retraso en la actualización
2. Verifica tu correo electrónico para confirmar que el pago fue procesado
3. Revisa la página de suscripción para ver el estado actual
4. Si después de 30 minutos no se actualiza, contacta a soporte con el ID de transacción

### No puedo cancelar mi suscripción

Si tienes problemas para cancelar tu suscripción:

1. Asegúrate de estar iniciando sesión con la misma cuenta que utilizaste para suscribirte
2. Intenta acceder a la página de suscripción directamente desde el menú de usuario
3. Limpia la caché y las cookies de tu navegador
4. Si persiste el problema, contacta a soporte

### No puedo acceder a características incluidas en mi plan

Si no puedes acceder a características que deberían estar disponibles en tu plan:

1. Verifica que tu suscripción esté activa en la página de suscripción
2. Intenta cerrar sesión y volver a iniciar sesión
3. Recarga la página donde intentas usar la característica
4. Si el problema persiste, contacta a soporte

## Otros Problemas Comunes

### La sala no se carga

Si la sala no se carga correctamente:

1. Verifica tu conexión a internet
2. Intenta recargar la página
3. Asegúrate de que estás usando el código de sala correcto
4. Prueba a unirte desde una ventana de incógnito para descartar problemas con extensiones del navegador

### No puedo crear una sala

Si no puedes crear una sala:

1. Verifica tu conexión a internet
2. Asegúrate de que no hay restricciones de red que bloqueen Firebase
3. Verifica que no hayas alcanzado el límite de salas activas de tu plan
4. Intenta usar un navegador diferente

### No puedo unirme a una sala

Si no puedes unirte a una sala existente:

1. Verifica que el código de sala sea correcto
2. Asegúrate de que la sala no haya alcanzado el límite de participantes del plan del creador
3. Verifica tu conexión a internet
4. Intenta unirte desde otro navegador o dispositivo

### Problemas de rendimiento

Si experimentas lentitud o problemas de rendimiento:

1. Cierra otras pestañas y aplicaciones para liberar recursos
2. Actualiza tu navegador a la última versión
3. Limpia la caché del navegador

### Problemas con el perfil de usuario

Si tienes problemas con tu perfil de usuario:

1. Asegúrate de que la imagen de perfil no sea demasiado grande (máximo recomendado: 1MB)
2. Si la imagen no se muestra correctamente, intenta subir una nueva imagen
3. Si los cambios en tu perfil no se guardan, verifica tu conexión a internet
4. Intenta cerrar sesión y volver a iniciar sesión

Para cualquier otro problema no listado aquí, por favor contacta al equipo de soporte o reporta el problema en nuestro repositorio de [GitHub](https://github.com/ProDrifterDK/poker-planning).