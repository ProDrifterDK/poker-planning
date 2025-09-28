'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { emotionTheme } from '../styles/theme';
import { Button } from './Button';
import Image from 'next/image';
import Link from 'next/link';

// Styled components using the design system
const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: ${emotionTheme.colors.background.default};
  border-bottom: 1px solid ${emotionTheme.colors.border.main};
  backdrop-filter: blur(10px);
  background: rgba(18, 18, 18, 0.95);
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${emotionTheme.spacing(4)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;

  @media (max-width: 768px) {
    padding: 0 ${emotionTheme.spacing(3)};
    height: 70px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const Logo = styled(Image)`
  height: 40px;
  width: auto;

  @media (max-width: 768px) {
    height: 32px;
  }
`;

const Navigation = styled.nav<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: ${emotionTheme.spacing(8)};

  @media (max-width: 768px) {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    background-color: ${emotionTheme.colors.background.paper};
    border-top: 1px solid ${emotionTheme.colors.border.main};
    border-bottom: 1px solid ${emotionTheme.colors.border.main};
    flex-direction: column;
    gap: ${emotionTheme.spacing(4)};
    padding: ${emotionTheme.spacing(6)};
    transform: ${({ isOpen }) => isOpen ? 'translateY(0)' : 'translateY(-100%)'};
    opacity: ${({ isOpen }) => isOpen ? 1 : 0};
    visibility: ${({ isOpen }) => isOpen ? 'visible' : 'hidden'};
    transition: all 0.3s ease-in-out;
  }
`;


const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${emotionTheme.spacing(4)};
  flex-shrink: 0;
`;

const HamburgerButton = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: ${emotionTheme.spacing(2)};
  color: ${emotionTheme.colors.text.primary};

  @media (max-width: 768px) {
    display: block;
  }

  &:focus {
    outline: 2px solid ${emotionTheme.colors.primary.main};
    outline-offset: 2px;
  }
`;

const HamburgerIcon = styled.div<{ isOpen: boolean }>`
  width: 24px;
  height: 2px;
  background-color: ${emotionTheme.colors.text.primary};
  position: relative;
  transition: all 0.3s ease;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 2px;
    background-color: ${emotionTheme.colors.text.primary};
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

const navigationLinks = [
  { href: '#features', labelKey: 'header.navigation.features' },
  { href: '#pricing', labelKey: 'header.navigation.pricing' },
  { href: '#about', labelKey: 'header.navigation.about' },
  { href: '#contact', labelKey: 'header.navigation.contact' },
];

export default function Header() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <Link href="/" onClick={closeMobileMenu}>
            <Logo
              src="/images/logo/logo.svg"
              alt={t('header.logoAlt')}
              width={160}
              height={40}
              priority
            />
          </Link>
        </LogoContainer>

        <Navigation isOpen={isMobileMenuOpen}>
          {navigationLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleSmoothScroll(link.href)}
              style={{
                background: 'none',
                border: 'none',
                color: emotionTheme.colors.text.primary,
                textDecoration: 'none',
                fontFamily: emotionTheme.typography.fontFamily.body,
                fontSize: emotionTheme.typography.fontSizes.body,
                fontWeight: emotionTheme.typography.fontWeights.regular,
                transition: 'color 0.2s ease',
                position: 'relative',
                cursor: 'pointer',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = emotionTheme.colors.primary.main;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = emotionTheme.colors.text.primary;
              }}
            >
              {t(link.labelKey)}
            </button>
          ))}
        </Navigation>

        <ActionsContainer>
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
        </ActionsContainer>
      </HeaderContent>
    </HeaderContainer>
  );
}
