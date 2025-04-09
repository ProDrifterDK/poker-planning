'use client';

import { Box, Typography, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function Footer() {
    const { t } = useTranslation('common');
    
    return (
        <Box
            component="footer"
            sx={{
                backgroundColor: 'background.paper',
                color: 'text.primary',
                py: 2,
                textAlign: 'center',
            }}
        >
            <Typography variant="body1">
                © {new Date().getFullYear()} {t('appName')}. {t('footer.allRightsReserved')}.
            </Typography>
            <Typography variant="body2">
                <Link href="/privacy-policy" color="inherit" underline="hover">
                    {t('footer.privacyPolicy')}
                </Link>
                {' | '}
                <Link href="/terms" color="inherit" underline="hover">
                    {t('footer.termsOfService')}
                </Link>
            </Typography>
            <Typography variant="caption">
                {t('footer.builtBy')}
            </Typography>
        </Box>
    );
}
