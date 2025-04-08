'use client';

import { useTranslation } from 'react-i18next';
import { Box, Typography, Container, Paper, Divider } from '@mui/material';

export default function TermsOfServicePage() {
  const { t } = useTranslation('common');

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          {t('terms.title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.lastUpdated')}
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('terms.section1Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.section1Content')}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('terms.section2Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.section2Content')}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('terms.section3Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.section3Content')}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('terms.section4Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.section4Content1')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.section4Content2')}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('terms.section5Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.section5Content')}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('terms.section6Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.section6Content')}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('terms.section7Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.section7Content')}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('terms.section8Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.section8Content')}
        </Typography>
        
        <Typography component="ul" sx={{ pl: 4 }}>
          {(t('terms.section8List', { returnObjects: true }) as string[]).map((item: string, index: number) => (
            <Typography key={index} component="li" variant="body1">{item}</Typography>
          ))}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('terms.section9Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.section9Content')}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('terms.section10Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.section10Content')}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('terms.section11Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.section11Content')}
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {t('terms.section12Title')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.section12Content')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('terms.contactEmail')}
        </Typography>
      </Paper>
    </Container>
  );
}