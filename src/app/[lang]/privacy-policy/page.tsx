'use client';

import { useTranslation } from 'react-i18next';
import { Box, Typography, Container, Paper, Divider, Link } from '@mui/material';

export default function PrivacyPolicyPage() {
  const { t } = useTranslation('common');

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          {t('privacy.title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.lastUpdated')}
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('privacy.section1Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.section1Content')}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('privacy.section2Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.section2Content')}
        </Typography>
        
        <Typography component="ul" sx={{ pl: 4 }}>
          {(t('privacy.section2List', { returnObjects: true }) as Array<{ title: string, content: string }>).map((item, index) => (
            <Typography key={index} component="li" variant="body1" paragraph>
              <strong>{item.title}</strong> {item.content}
            </Typography>
          ))}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('privacy.section3Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.section3Content')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.section3Content2')}
        </Typography>
        
        <Typography component="ul" sx={{ pl: 4 }}>
          {(t('privacy.section3List', { returnObjects: true }) as string[]).map((item, index) => (
            <Typography key={index} component="li" variant="body1" paragraph>
              {item}
            </Typography>
          ))}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.section3Content3')}{' '}
          <Link href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            {t('privacy.section3Link1')}
          </Link>.
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.section3Content4')}{' '}
          <Link href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
            {t('privacy.section3Link2')}
          </Link>.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('privacy.section4Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.section4Content')}
        </Typography>
        
        <Typography component="ul" sx={{ pl: 4 }}>
          {(t('privacy.section4List', { returnObjects: true }) as Array<{ title: string, content: string }>).map((item, index) => (
            <Typography key={index} component="li" variant="body1" paragraph>
              <strong>{item.title}</strong> {item.content}
            </Typography>
          ))}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('privacy.section5Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.section5Content')}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('privacy.section6Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.section6Content')}
        </Typography>
        
        <Typography component="ul" sx={{ pl: 4 }}>
          {(t('privacy.section6List', { returnObjects: true }) as Array<{ title: string, content: string }>).map((item, index) => (
            <Typography key={index} component="li" variant="body1" paragraph>
              <strong>{item.title}</strong> {item.content}
            </Typography>
          ))}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('privacy.section7Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.section7Content')}
        </Typography>
        
        <Typography component="ul" sx={{ pl: 4 }}>
          {(t('privacy.section7List', { returnObjects: true }) as string[]).map((item, index) => (
            <Typography key={index} component="li" variant="body1">
              {item}
            </Typography>
          ))}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('privacy.section8Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.section8Content')}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('privacy.section9Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.section9Content')}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('privacy.section10Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.section10Content')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('privacy.contactEmail')}
        </Typography>
      </Paper>
    </Container>
  );
}