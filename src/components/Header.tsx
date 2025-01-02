'use client';

import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import ThemeToggleButton from './ThemeToggleButton';

export default function Header() {
    const router = useRouter();

    return (
        <AppBar position="static" color="primary">
            <Toolbar>
                <Typography
                    variant="h6"
                    component="button"
                    sx={{ flexGrow: 1 }}
                    onClick={() => router.push('/')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                >
                    Planning Poker
                </Typography>
                <Box>
                    <ThemeToggleButton />
                </Box>
            </Toolbar>
        </AppBar>
    );
}
