'use client';

import { Box, Typography, Link } from '@mui/material';

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                backgroundColor: 'text.secondary',
                color: 'primary.contrastText',
                py: 2,
                textAlign: 'center',
            }}
        >
            <Typography variant="body2">
                © {new Date().getFullYear()} Planning Poker. Todos los derechos reservados.
            </Typography>
            <Typography variant="body2">
                <Link href="https://example.com" color="inherit" underline="hover">
                    Política de Privacidad
                </Link>
            </Typography>
        </Box>
    );
}
