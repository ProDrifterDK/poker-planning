'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { darkEmotionTheme } from '../../styles/theme';
import { User } from 'firebase/auth';
import { User as UserIcon } from 'iconoir-react';
import Image from 'next/image';
import { useAuth } from '../../context/authContext';

interface UserMenuProps {
  currentUser: User;
}

const UserMenuContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${darkEmotionTheme.spacing(2)};
  background: none;
  border: 1px solid ${darkEmotionTheme.colors.border.main};
  border-radius: ${darkEmotionTheme.borderRadius.large};
  padding: ${darkEmotionTheme.spacing(2)} ${darkEmotionTheme.spacing(3)};
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${darkEmotionTheme.colors.text.primary};

  &:hover {
    border-color: ${darkEmotionTheme.colors.primary.main};
    background-color: ${darkEmotionTheme.colors.background.paper};
  }

  &:focus {
    outline: 2px solid ${darkEmotionTheme.colors.primary.main};
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    padding: ${darkEmotionTheme.spacing(2)};
    gap: ${darkEmotionTheme.spacing(1)};
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${darkEmotionTheme.colors.primary.main};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${darkEmotionTheme.typography.fontWeights.medium};
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;

  @media (max-width: 768px) {
    display: none;
  }
`;

const UserName = styled.span`
  font-size: ${darkEmotionTheme.typography.fontSizes.body};
  font-weight: ${darkEmotionTheme.typography.fontWeights.medium};
  color: ${darkEmotionTheme.colors.text.primary};
  line-height: 1.2;
`;

const UserEmail = styled.span`
  font-size: ${darkEmotionTheme.typography.fontSizes.caption};
  color: ${darkEmotionTheme.colors.text.secondary};
  line-height: 1.2;
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: ${darkEmotionTheme.colors.background.paper};
  border: 1px solid ${darkEmotionTheme.colors.border.main};
  border-radius: ${darkEmotionTheme.borderRadius.large};
  box-shadow: ${darkEmotionTheme.shadows.small};
  min-width: 200px;
  padding: ${darkEmotionTheme.spacing(2)};
  margin-top: ${darkEmotionTheme.spacing(1)};
  z-index: 1000;
  opacity: ${({ isOpen }) => isOpen ? 1 : 0};
  visibility: ${({ isOpen }) => isOpen ? 'visible' : 'hidden'};
  transform: ${({ isOpen }) => isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    right: -${darkEmotionTheme.spacing(2)};
    min-width: 180px;
  }
`;

const MenuItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${darkEmotionTheme.spacing(2)};
  padding: ${darkEmotionTheme.spacing(2)} ${darkEmotionTheme.spacing(3)};
  background: none;
  border: none;
  border-radius: ${darkEmotionTheme.borderRadius.medium};
  color: ${darkEmotionTheme.colors.text.primary};
  font-size: ${darkEmotionTheme.typography.fontSizes.body};
  font-weight: ${darkEmotionTheme.typography.fontWeights.regular};
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${darkEmotionTheme.colors.background.default};
    color: ${darkEmotionTheme.colors.primary.main};
  }

  &:focus {
    outline: 2px solid ${darkEmotionTheme.colors.primary.main};
    outline-offset: 2px;
  }
`;

const MenuDivider = styled.hr`
  border: none;
  border-top: 1px solid ${darkEmotionTheme.colors.border.main};
  margin: ${darkEmotionTheme.spacing(2)} 0;
`;

export default function UserMenu({ currentUser }: UserMenuProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      closeDropdown();
      // El logout ya maneja la navegación automáticamente
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleMenuClick = (action: string) => {
    closeDropdown();

    switch (action) {
      case 'profile':
        const currentLang = i18n.language || 'en';
        router.push(`/${currentLang}/profile`);
        break;
      case 'settings':
        const currentLangSettings = i18n.language || 'en';
        router.push(`/${currentLangSettings}/settings`);
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  const getDisplayName = () => {
    return currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario';
  };


  return (
    <UserMenuContainer>
      <UserButton onClick={toggleDropdown} aria-label="User menu">
        <UserAvatar>
          {currentUser.photoURL && currentUser.photoURL !== 'guest_user' ? (
            <Image
              src={currentUser.photoURL}
              alt="User avatar"
              width={32}
              height={32}
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <UserIcon width={16} height={16} />
          )}
        </UserAvatar>
        <UserInfo>
          <UserName>{getDisplayName()}</UserName>
          {currentUser.email && (
            <UserEmail>{currentUser.email}</UserEmail>
          )}
        </UserInfo>
      </UserButton>

      <DropdownMenu isOpen={isDropdownOpen}>
        <MenuItem onClick={() => handleMenuClick('profile')}>
          {t('header.userMenu.profile', 'Perfil')}
        </MenuItem>
        <MenuItem onClick={() => handleMenuClick('settings')}>
          {t('header.userMenu.settings', 'Ajustes')}
        </MenuItem>
        <MenuDivider />
        <MenuItem onClick={() => handleMenuClick('logout')}>
          {t('header.userMenu.logout', 'Cerrar sesión')}
        </MenuItem>
      </DropdownMenu>

      {isDropdownOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={closeDropdown}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeDropdown();
            }
          }}
          tabIndex={-1}
          role="button"
          aria-label="Close menu"
        />
      )}
    </UserMenuContainer>
  );
}