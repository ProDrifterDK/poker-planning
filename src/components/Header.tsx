'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, usePathname } from 'next/navigation';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import { Button } from './Button';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../context/authContext';
import UserMenu from './auth/UserMenu';
import { Typography } from '@mui/material';
import ThemeToggleButton from './ThemeToggleButton';
import LanguageSelector from './LanguageSelector';

// Styled components using the design system
const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: ${props => props.theme.colors.background.default};
  border-bottom: 1px solid ${props => props.theme.colors.border.main};
  backdrop-filter: blur(10px);
`;

const NavLink = styled(Link)`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-size: ${({ theme }) => theme.typography.fontSizes.body};
  font-weight: ${({ theme }) => theme.typography.fontWeights.regular};
  transition: color 0.2s ease;
  position: relative;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
  }
`;

const AppTitleTypography = styled(Typography)`
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing(4)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;

  @media (max-width: 768px) {
    padding: 0 ${({ theme }) => theme.spacing(3)};
    height: 70px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 40px;

  @media (max-width: 768px) {
    height: 32px;
  }
`;

const Logo = styled(Image)`
  height: 100%;
  width: auto;
`;

const LogoLink = styled(Link)`
  height: 100%;
  display: flex;
`;

const Navigation = styled.nav<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(8)};

  @media (max-width: 768px) {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    background-color: ${props => props.theme.colors.background.paper};
    border-top: 1px solid ${props => props.theme.colors.border.main};
    border-bottom: 1px solid ${props => props.theme.colors.border.main};
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(4)};
    padding: ${({ theme }) => theme.spacing(6)};
    transform: ${({ isOpen }) => isOpen ? 'translateY(0)' : 'translateY(-100%)'};
    opacity: ${({ isOpen }) => isOpen ? 1 : 0};
    visibility: ${({ isOpen }) => isOpen ? 'visible' : 'hidden'};
    transition: all 0.3s ease-in-out;
  }
`;

// App title component for authenticated users
const AppTitle = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 768px) {
    display: none;
  }
`;


const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(4)};
  flex-shrink: 0;

  @media (max-width: 768px) {
    gap: ${({ theme }) => theme.spacing(2)};
  }
`;

const HamburgerButton = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing(2)};
  color: ${props => props.theme.colors.text.primary};

  @media (max-width: 768px) {
    display: block;
  }

  &:focus {
    outline: 2px solid ${props => props.theme.colors.primary.main};
    outline-offset: 2px;
  }
`;

const HamburgerIcon = styled.div<{ isOpen: boolean }>`
  width: 24px;
  height: 2px;
  background-color: ${props => props.theme.colors.text.primary};
  position: relative;
  transition: all 0.3s ease;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 2px;
    background-color: ${props => props.theme.colors.text.primary};
    transition: all 0.3s ease;
  }

  &::before {
    top: -8px;
    transform: ${({ isOpen }) => isOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none'};
  }

  &::after {
    top: 8px;
    transform: ${({ isOpen }) => isOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none'};
  }

  ${({ isOpen }) => isOpen && `
    background-color: transparent;
  `}
`;

interface NavigationLink {
  href: string;
  labelKey: string;
}

const marketingNavigationLinks: NavigationLink[] = [
  { href: '#features', labelKey: 'header.navigation.features' },
  { href: '#pricing', labelKey: 'header.navigation.pricing' },
  { href: '#about', labelKey: 'header.navigation.about' },
  { href: '#contact', labelKey: 'header.navigation.contact' },
];

const appNavigationLinks: NavigationLink[] = [
  { href: '/rooms', labelKey: 'header.navigation.myRooms' },
  { href: '/rooms/create', labelKey: 'header.navigation.createRoom' },
];

interface HeaderProps {
  variant?: 'marketing' | 'app';
}

export default function Header({ variant: propVariant }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-detect variant based on current route if not explicitly provided
  const variant = propVariant || (pathname === '/' || pathname.startsWith('/?') ? 'marketing' : 'app');

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSmoothScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    closeMobileMenu();
  };

  const handleSignUp = () => {
    const currentLang = i18n.language || 'en';
    router.push(`/${currentLang}/auth/signup`);
    closeMobileMenu();
  };

  const handleSignIn = () => {
    const currentLang = i18n.language || 'en';
    router.push(`/${currentLang}/auth/signin`);
    closeMobileMenu();
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <LogoContainer>
          <LogoLink href="/" onClick={closeMobileMenu}>
            <Logo
              src="/images/logo/logo.svg"
              alt={t('header.logoAlt')}
              width={160}
              height={40}
              priority
            />
          </LogoLink>
        </LogoContainer>

        {currentUser && variant === 'app' ? (
          // Show contextual title for authenticated users in app variant
          <AppTitle>
            <AppTitleTypography variant="h2">
              {t('header.appTitle')}
            </AppTitleTypography>
          </AppTitle>
        ) : (
          // Show navigation for marketing variant or non-authenticated users
          <Navigation isOpen={isMobileMenuOpen}>
            {(() => {
              // Determine which navigation links to show
              let linksToShow;
              if (variant === 'marketing') {
                linksToShow = marketingNavigationLinks;
              } else {
                linksToShow = marketingNavigationLinks;
              }

              return linksToShow.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                >
                  {t(link.labelKey)}
                </NavLink>
              ));
            })()}
          </Navigation>
        )}

        <ActionsContainer>
          {currentUser ? (
            // Usuario autenticado
            <>
              <ThemeToggleButton />
              <LanguageSelector />
              <UserMenu currentUser={currentUser} />
            </>
          ) : (
            // Usuario no autenticado - vista de marketing
            <>
              <ThemeToggleButton />
              <LanguageSelector />

              <HamburgerButton
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
              >
                <HamburgerIcon isOpen={isMobileMenuOpen} />
              </HamburgerButton>

              <Button variant="secondary" onClick={handleSignIn}>
                {t('login')}
              </Button>

              <Button variant="primary" onClick={handleSignUp}>
                {t('header.cta')}
              </Button>
            </>
          )}
        </ActionsContainer>
      </HeaderContent>
    </HeaderContainer>
  );
}
