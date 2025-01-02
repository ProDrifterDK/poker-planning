'use client';

import { Box, Typography, Link } from '@mui/material';

export default function Footer() {
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
                © {new Date().getFullYear()} Planning Poker. Todos los derechos reservados.
            </Typography>
            <Typography variant="body2">
                <Link href="https://example.com" color="inherit" underline="hover">
                    Política de Privacidad
                </Link>
            </Typography>
            <Typography variant="caption">
                Construido por Resyst Softwares
            </Typography>
        </Box>
    );
}
