'use client';

import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import ThemeToggleButton from './ThemeToggleButton';

export default function Header() {
    return (
        <AppBar position="static" color="primary">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Planning Poker
                </Typography>
                <Box>
                    <ThemeToggleButton />
                </Box>
            </Toolbar>
        </AppBar>
    );
}
