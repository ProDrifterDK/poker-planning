'use client';

import { Box, Typography, Container, Paper, Divider } from '@mui/material';

export default function TermsOfServicePage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Términos de Servicio
        </Typography>
        
        <Typography variant="body1" paragraph>
          Última actualización: 5 de Abril, 2025
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          1. Aceptación de los Términos
        </Typography>
        
        <Typography variant="body1" paragraph>
          Al acceder o utilizar Poker Planning Pro (&quot;la aplicación&quot;), usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder a la aplicación.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          2. Descripción del Servicio
        </Typography>
        
        <Typography variant="body1" paragraph>
          Poker Planning Pro es una aplicación web que permite a los equipos realizar sesiones de Planning Poker para estimar tareas en proyectos ágiles. Ofrecemos diferentes planes de suscripción con distintas características y limitaciones.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          3. Cuentas de Usuario
        </Typography>
        
        <Typography variant="body1" paragraph>
          Para acceder a ciertas funciones de la aplicación, debe crear una cuenta. Usted es responsable de mantener la confidencialidad de su cuenta y contraseña, y acepta la responsabilidad de todas las actividades que ocurran bajo su cuenta.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          4. Planes de Suscripción y Pagos
        </Typography>
        
        <Typography variant="body1" paragraph>
          Ofrecemos un plan gratuito y planes de pago (Pro y Enterprise). Los pagos se procesan a través de proveedores de servicios de pago de terceros. Al suscribirse a un plan de pago, acepta pagar todas las tarifas asociadas con su plan.
        </Typography>
        
        <Typography variant="body1" paragraph>
          Las suscripciones se renuevan automáticamente a menos que las cancele antes de la fecha de renovación. Puede cancelar su suscripción en cualquier momento desde la configuración de su cuenta.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          5. Publicidad
        </Typography>
        
        <Typography variant="body1" paragraph>
          Los usuarios del plan gratuito verán anuncios proporcionados por Google AdSense. Estos anuncios están sujetos a la política de privacidad de Google. Los planes de pago incluyen la característica &quot;Sin anuncios&quot;.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          6. Propiedad Intelectual
        </Typography>
        
        <Typography variant="body1" paragraph>
          La aplicación y su contenido original, características y funcionalidad son propiedad de Resyst Softwares y están protegidos por leyes internacionales de derechos de autor, marcas registradas, patentes, secretos comerciales y otras leyes de propiedad intelectual.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          7. Contenido del Usuario
        </Typography>
        
        <Typography variant="body1" paragraph>
          Usted conserva todos los derechos sobre el contenido que crea, sube o comparte a través de la aplicación. Al proporcionar contenido, nos otorga una licencia mundial, no exclusiva, libre de regalías para usar, reproducir, modificar, adaptar, publicar, transmitir y mostrar dicho contenido.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          8. Conducta Prohibida
        </Typography>
        
        <Typography variant="body1" paragraph>
          Usted acepta no utilizar la aplicación para:
        </Typography>
        
        <Typography component="ul" sx={{ pl: 4 }}>
          <Typography component="li" variant="body1">Violar cualquier ley aplicable</Typography>
          <Typography component="li" variant="body1">Infringir los derechos de propiedad intelectual de terceros</Typography>
          <Typography component="li" variant="body1">Transmitir material ilegal, abusivo, difamatorio, obsceno o de otro modo objetable</Typography>
          <Typography component="li" variant="body1">Transmitir virus, troyanos u otro código malicioso</Typography>
          <Typography component="li" variant="body1">Interferir con el funcionamiento normal de la aplicación</Typography>
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          9. Limitación de Responsabilidad
        </Typography>
        
        <Typography variant="body1" paragraph>
          En ningún caso Resyst Softwares, sus directores, empleados o agentes serán responsables de cualquier daño directo, indirecto, incidental, especial, punitivo o consecuente que surja del uso de la aplicación.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          10. Modificaciones
        </Typography>
        
        <Typography variant="body1" paragraph>
          Nos reservamos el derecho de modificar o reemplazar estos términos en cualquier momento. Le notificaremos cualquier cambio significativo publicando los nuevos Términos de Servicio en esta página.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          11. Ley Aplicable
        </Typography>
        
        <Typography variant="body1" paragraph>
          Estos términos se regirán e interpretarán de acuerdo con las leyes de Chile, sin tener en cuenta sus disposiciones sobre conflictos de leyes.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          12. Contacto
        </Typography>
        
        <Typography variant="body1" paragraph>
          Si tiene preguntas sobre estos Términos de Servicio, contáctenos en:
        </Typography>
        
        <Typography variant="body1" paragraph>
          Email: alan.resyst@gmail.com
        </Typography>
      </Paper>
    </Container>
  );
}