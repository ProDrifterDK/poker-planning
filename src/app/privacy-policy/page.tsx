'use client';

import { Box, Typography, Container, Paper, Divider, Link } from '@mui/material';

export default function PrivacyPolicyPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Política de Privacidad
        </Typography>
        
        <Typography variant="body1" paragraph>
          Última actualización: 5 de Abril, 2025
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          1. Introducción
        </Typography>
        
        <Typography variant="body1" paragraph>
          Poker Planning Pro (&quot;nosotros&quot;, &quot;nuestro&quot;, o &quot;la aplicación&quot;) se compromete a proteger su privacidad. 
          Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos su información cuando utiliza nuestra aplicación web.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          2. Información que Recopilamos
        </Typography>
        
        <Typography variant="body1" paragraph>
          Recopilamos varios tipos de información, incluyendo:
        </Typography>
        
        <Typography component="ul" sx={{ pl: 4 }}>
          <Typography component="li" variant="body1" paragraph>
            <strong>Información de cuenta:</strong> Cuando se registra, recopilamos su nombre, dirección de correo electrónico y contraseña.
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            <strong>Información de perfil:</strong> Foto de perfil, cargo, empresa y otra información que decida proporcionar.
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            <strong>Información de uso:</strong> Datos sobre cómo interactúa con nuestra aplicación, incluyendo las salas que crea o a las que se une, las estimaciones que realiza, etc.
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            <strong>Información técnica:</strong> Dirección IP, tipo de navegador, dispositivo, sistema operativo, y datos similares.
          </Typography>
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          3. Uso de Google AdSense
        </Typography>
        
        <Typography variant="body1" paragraph>
          Utilizamos Google AdSense, un servicio de publicidad proporcionado por Google LLC, para mostrar anuncios en nuestra aplicación. Google AdSense utiliza cookies y tecnologías similares para mostrar anuncios relevantes a los usuarios.
        </Typography>
        
        <Typography variant="body1" paragraph>
          Google AdSense puede utilizar la siguiente información:
        </Typography>
        
        <Typography component="ul" sx={{ pl: 4 }}>
          <Typography component="li" variant="body1" paragraph>
            Cookies para rastrear su actividad de navegación y mostrar anuncios personalizados.
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Su dirección IP para aproximar su ubicación y asegurar que los anuncios sean relevantes para su región.
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Información sobre su dispositivo y navegador para optimizar la visualización de anuncios.
          </Typography>
        </Typography>
        
        <Typography variant="body1" paragraph>
          Puede optar por no utilizar la cookie de DART para publicidad basada en intereses visitando la{' '}
          <Link href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            página de Configuración de anuncios de Google
          </Link>.
        </Typography>
        
        <Typography variant="body1" paragraph>
          Para más información sobre cómo Google utiliza la información recopilada a través de AdSense, visite la{' '}
          <Link href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
            página de Políticas de Privacidad de Google
          </Link>.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          4. Planes de Suscripción y Anuncios
        </Typography>
        
        <Typography variant="body1" paragraph>
          Ofrecemos diferentes planes de suscripción:
        </Typography>
        
        <Typography component="ul" sx={{ pl: 4 }}>
          <Typography component="li" variant="body1" paragraph>
            <strong>Plan Free:</strong> Los usuarios del plan gratuito verán anuncios proporcionados por Google AdSense.
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            <strong>Planes Pro y Enterprise:</strong> Estos planes de pago incluyen la característica &quot;Sin anuncios&quot;, lo que significa que los usuarios con estos planes no verán anuncios en la aplicación.
          </Typography>
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          5. Cookies y Tecnologías Similares
        </Typography>
        
        <Typography variant="body1" paragraph>
          Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el tráfico y personalizar el contenido. Al utilizar nuestra aplicación, acepta el uso de estas tecnologías.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          6. Compartir Información
        </Typography>
        
        <Typography variant="body1" paragraph>
          Podemos compartir su información en las siguientes circunstancias:
        </Typography>
        
        <Typography component="ul" sx={{ pl: 4 }}>
          <Typography component="li" variant="body1" paragraph>
            <strong>Proveedores de servicios:</strong> Compartimos información con terceros que nos ayudan a operar, proporcionar, mejorar, integrar, personalizar y promocionar nuestra aplicación.
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            <strong>Cumplimiento legal:</strong> Podemos divulgar información si creemos de buena fe que es necesario para cumplir con la ley, proteger nuestros derechos o prevenir fraudes o abusos.
          </Typography>
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          7. Sus Derechos
        </Typography>
        
        <Typography variant="body1" paragraph>
          Dependiendo de su ubicación, puede tener ciertos derechos relacionados con sus datos personales, como:
        </Typography>
        
        <Typography component="ul" sx={{ pl: 4 }}>
          <Typography component="li" variant="body1">Acceder a sus datos personales</Typography>
          <Typography component="li" variant="body1">Corregir datos inexactos</Typography>
          <Typography component="li" variant="body1">Eliminar sus datos</Typography>
          <Typography component="li" variant="body1">Oponerse al procesamiento de sus datos</Typography>
          <Typography component="li" variant="body1">Solicitar la portabilidad de sus datos</Typography>
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          8. Seguridad
        </Typography>
        
        <Typography variant="body1" paragraph>
          Implementamos medidas de seguridad diseñadas para proteger su información. Sin embargo, ningún sistema es completamente seguro, y no podemos garantizar la seguridad absoluta de su información.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          9. Cambios a esta Política
        </Typography>
        
        <Typography variant="body1" paragraph>
          Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos cualquier cambio significativo publicando la nueva Política de Privacidad en esta página.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          10. Contacto
        </Typography>
        
        <Typography variant="body1" paragraph>
          Si tiene preguntas sobre esta Política de Privacidad, contáctenos en:
        </Typography>
        
        <Typography variant="body1" paragraph>
          Email: alan.resyst@gmail.com
        </Typography>
      </Paper>
    </Container>
  );
}