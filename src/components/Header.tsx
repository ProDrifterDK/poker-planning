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
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PersonIcon from '@mui/icons-material/Person';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/types/subscription';

export default function Header() {
    const router = useRouter();
    const { currentUser, logout, isModerator } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    
    // Obtener el plan actual del usuario
    const { fetchUserSubscription, getCurrentPlan } = useSubscriptionStore();
    const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE);
    
    useEffect(() => {
        if (currentUser) {
            // Cargar la suscripción del usuario
            fetchUserSubscription(currentUser.uid)
                .then(() => {
                    setCurrentPlan(getCurrentPlan());
                })
                .catch(error => {
                    console.error('Error al cargar la suscripción:', error);
                });
        }
    }, [currentUser, fetchUserSubscription, getCurrentPlan]);

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
                    Poker Planning Pro
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
                                    <Box>
                                        <Typography variant="body2" noWrap>
                                            {currentUser.displayName || currentUser.email}
                                        </Typography>
                                        <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                                            Plan {SUBSCRIPTION_PLANS[currentPlan].name}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                                <Divider />
                                <MenuItem onClick={handleProfile}>
                                    Mi Perfil
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    router.push('/settings');
                                    handleClose();
                                }}>
                                    Configuración
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    router.push('/settings/subscription');
                                    handleClose();
                                }}>
                                    Suscripción
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    router.push('/settings/integrations');
                                    handleClose();
                                }}>
                                    Integraciones
                                </MenuItem>
                                {isModerator() && (
                                    <MenuItem onClick={() => {
                                        router.push('/admin');
                                        handleClose();
                                    }}>
                                        Panel de Administración
                                    </MenuItem>
                                )}
                                <MenuItem onClick={() => {
                                    router.push('/become-admin');
                                    handleClose();
                                }}>
                                    Convertirse en Moderador
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
