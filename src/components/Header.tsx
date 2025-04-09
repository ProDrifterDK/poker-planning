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
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/types/subscription';
import { getPlanLookupKey } from '@/utils/planUtils';
import { useUserProfile } from '@/hooks/useUserProfile';
import ClientLanguageSwitch from './ClientLanguageSwitch';
import { useTranslation } from 'react-i18next';
import LanguageAwareComponent from './LanguageAwareComponent';

// Lista de idiomas soportados
const supportedLocales = ['es', 'en'];

// Función auxiliar para obtener el nombre del plan de forma segura
const getPlanName = (plan: SubscriptionPlan): string => {
    // Usar la función auxiliar para obtener la clave correcta
    const planLookupKey = getPlanLookupKey(plan);
    
    // Obtener el nombre del plan
    return SUBSCRIPTION_PLANS[planLookupKey].name;
};

// Función auxiliar para obtener la ruta con el idioma
const getLocalizedRoute = (route: string): string => {
    // Intentar obtener el idioma de i18next primero (cliente)
    let lang = 'es'; // Valor por defecto
    
    if (typeof window !== 'undefined') {
        // Estamos en el cliente, podemos acceder a i18next
        const i18nLang = window.localStorage.getItem('i18nextLng');
        
        if (i18nLang && supportedLocales.includes(i18nLang)) {
            lang = i18nLang;
        } else {
            // Fallback a la URL si no hay idioma en i18next
            const urlLang = window.location.pathname.split('/')[1];
            if (supportedLocales.includes(urlLang)) {
                lang = urlLang;
            }
        }
    }
    
    return `/${lang}${route}`;
};

export default function Header() {
    const router = useRouter();
    const { currentUser, logout, isModerator, isGuestUser } = useAuth();
    const { profilePhotoURL, reloadProfile } = useUserProfile();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const { t } = useTranslation('common');
    
    // Verificar si el usuario es invitado
    const isGuest = isGuestUser();
    
    // Forzar una recarga del perfil solo cuando el componente se monta o cambia el usuario
    useEffect(() => {
        if (currentUser) {
            console.log('Header: Forzando recarga del perfil al montar');
            // Usar una función anónima para evitar la dependencia en reloadProfile
            const loadProfile = () => reloadProfile();
            loadProfile();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]); // Eliminar reloadProfile de las dependencias
    
    // Obtener el plan actual del usuario
    const { fetchUserSubscription, getCurrentPlan, currentSubscription } = useSubscriptionStore();
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
    
    // Actualizar el plan cuando cambie la suscripción
    useEffect(() => {
        if (currentSubscription) {
            console.log('Header: Actualizando plan a', currentSubscription.plan);
            setCurrentPlan(currentSubscription.plan);
        }
    }, [currentSubscription]);

    // Forzar una recarga de la suscripción cada vez que se renderiza el componente
    useEffect(() => {
        if (currentUser) {
            console.log('Header: Forzando recarga de suscripción');
            fetchUserSubscription(currentUser.uid)
                .then((subscription) => {
                    if (subscription) {
                        console.log('Header: Suscripción recargada', subscription.plan);
                        setCurrentPlan(subscription.plan);
                    }
                })
                .catch(error => {
                    console.error('Error al recargar la suscripción:', error);
                });
        }
    }, [currentUser, fetchUserSubscription]);

    // Función para obtener el nombre traducido del plan
    const getTranslatedPlanName = (plan: SubscriptionPlan): string => {
        const planLookupKey = getPlanLookupKey(plan);
        
        // Determinar la clave de traducción basada en el plan y el intervalo de facturación
        let translationKey = 'free';
        
        if (planLookupKey.includes('-')) {
            // Es un plan con intervalo de facturación específico (ej: pro-month)
            const [planType, interval] = planLookupKey.split('-');
            translationKey = planType + (interval === 'month' ? 'Monthly' : 'Yearly');
        } else {
            // Es un plan simple (ej: free)
            translationKey = planLookupKey;
        }
        
        // Obtener el nombre traducido del plan
        return t(`planNames.${translationKey}`, SUBSCRIPTION_PLANS[planLookupKey].name);
    };

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
        router.push(getLocalizedRoute('/profile'));
        handleClose();
    };

    return (
        <AppBar position="static" color="primary">
            <Toolbar>
                <LanguageAwareComponent>
                    <Typography
                        variant="h6"
                        component="button"
                        sx={{ flexGrow: 1 }}
                        onClick={() => router.push(getLocalizedRoute(''))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                    >
                        {t('appName', 'Poker Planning Pro')}
                    </Typography>
                </LanguageAwareComponent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ClientLanguageSwitch />
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
                                {profilePhotoURL && profilePhotoURL !== 'guest_user' ? (
                                    <Avatar
                                        src={profilePhotoURL}
                                        alt={currentUser.displayName || 'Usuario'}
                                        sx={{ width: 32, height: 32 }}
                                    />
                                ) : isGuest ? (
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'info.main' }}>
                                        <AccountCircleIcon fontSize="small" />
                                    </Avatar>
                                ) : (
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                        <PersonIcon fontSize="small" />
                                    </Avatar>
                                )}
                            </IconButton>
                            <LanguageAwareComponent>
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
                                            {isGuest ? (
                                                <Typography variant="caption" color="info.main" sx={{ display: 'block' }}>
                                                    {t('menu.guestUser')}
                                                </Typography>
                                            ) : (
                                                <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                                                    {t('menu.plan')} {getTranslatedPlanName(currentPlan)}
                                                </Typography>
                                            )}
                                        </Box>
                                    </MenuItem>
                                    <Divider />
                                    {!isGuest && (
                                        <>
                                            <MenuItem onClick={handleProfile}>
                                                {t('menu.myProfile')}
                                            </MenuItem>
                                            <MenuItem onClick={() => {
                                                router.push(getLocalizedRoute('/settings'));
                                                handleClose();
                                            }}>
                                                {t('menu.settings')}
                                            </MenuItem>
                                            <MenuItem onClick={() => {
                                                router.push(getLocalizedRoute('/settings/subscription'));
                                                handleClose();
                                            }}>
                                                {t('menu.subscription')}
                                            </MenuItem>
                                            <MenuItem onClick={() => {
                                                router.push(getLocalizedRoute('/settings/integrations'));
                                                handleClose();
                                            }}>
                                                {t('menu.integrations')}
                                            </MenuItem>
                                        </>
                                    )}
                                    {isModerator() && (
                                        <MenuItem onClick={() => {
                                            router.push(getLocalizedRoute('/admin'));
                                            handleClose();
                                        }}>
                                            {t('menu.adminPanel')}
                                        </MenuItem>
                                    )}
                                    <MenuItem onClick={handleLogout}>
                                        {t('menu.logout')}
                                    </MenuItem>
                                </Menu>
                            </LanguageAwareComponent>
                        </>
                    ) : (
                        <LanguageAwareComponent>
                            <Link href={getLocalizedRoute('/auth/signin')} passHref>
                                <Button
                                    color="info"
                                    variant="contained"
                                    size="small"
                                    sx={{
                                        ml: 1,
                                        textTransform: "none"
                                    }}
                                >
                                    {t('login')}
                                </Button>
                            </Link>
                        </LanguageAwareComponent>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}
