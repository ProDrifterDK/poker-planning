'use client';

import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Divider
} from '@mui/material';
import { useRouter } from 'next/navigation';
import ThemeToggleButton from './ThemeToggleButton';
import { OnboardingButton } from './Onboarding';
import { useAuth } from '@/context/authContext';
import { useState } from 'react';
import Link from 'next/link';
import PersonIcon from '@mui/icons-material/Person';

export default function Header() {
    const router = useRouter();
    const { currentUser, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await logout();
            handleClose();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    const handleProfile = () => {
        router.push('/profile');
        handleClose();
    };

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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <OnboardingButton variant="icon" color="inherit" />
                    <ThemeToggleButton />
                    
                    {currentUser ? (
                        <>
                            <IconButton
                                onClick={handleClick}
                                size="small"
                                aria-controls={open ? 'account-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={open ? 'true' : undefined}
                                sx={{ ml: 1 }}
                            >
                                {currentUser.photoURL ? (
                                    <Avatar
                                        src={currentUser.photoURL}
                                        alt={currentUser.displayName || 'Usuario'}
                                        sx={{ width: 32, height: 32 }}
                                    />
                                ) : (
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                        <PersonIcon fontSize="small" />
                                    </Avatar>
                                )}
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                id="account-menu"
                                open={open}
                                onClose={handleClose}
                                PaperProps={{
                                    elevation: 3,
                                    sx: {
                                        overflow: 'visible',
                                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                                        mt: 1.5,
                                        minWidth: 180,
                                        '& .MuiAvatar-root': {
                                            width: 32,
                                            height: 32,
                                            ml: -0.5,
                                            mr: 1,
                                        },
                                    },
                                }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <MenuItem sx={{ pointerEvents: 'none', opacity: 0.7 }}>
                                    <Typography variant="body2" noWrap>
                                        {currentUser.displayName || currentUser.email}
                                    </Typography>
                                </MenuItem>
                                <Divider />
                                <MenuItem onClick={handleProfile}>
                                    Mi Perfil
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    Cerrar Sesión
                                </MenuItem>
                            </Menu>
                        </>
                    ) : (
                        <Link href="/auth/signin" passHref>
                            <Button
                                color="info"
                                variant="contained"
                                size="small"
                                sx={{
                                    ml: 1,
                                    textTransform: "none"
                                }}
                            >
                                Iniciar Sesión
                            </Button>
                        </Link>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}
