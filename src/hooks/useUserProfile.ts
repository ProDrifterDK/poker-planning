'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/authContext';
import { getUserProfile } from '@/lib/userProfileService';

/**
 * Hook personalizado para obtener y gestionar el perfil del usuario
 * Incluye la foto de perfil desde Firestore
 */
export function useUserProfile() {
  const { currentUser } = useAuth();
  const [profilePhotoURL, setProfilePhotoURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  
  // Usar useRef para almacenar el timeout entre renderizados
  const reloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función para cargar el perfil del usuario
  const loadUserProfile = async () => {
    if (!currentUser) {
      setProfilePhotoURL(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('useUserProfile: Cargando perfil del usuario...');
      const profileData = await getUserProfile(currentUser.uid);
      
      if (profileData && profileData.photoURL) {
        console.log('useUserProfile: Foto de perfil encontrada en Firestore');
        setProfilePhotoURL(profileData.photoURL);
      } else {
        console.log('useUserProfile: No hay foto en Firestore, usando la de Firebase Auth');
        setProfilePhotoURL(currentUser.photoURL);
      }
    } catch (err) {
      console.error('Error al cargar el perfil del usuario:', err);
      setError('No se pudo cargar la foto de perfil');
      // Usar la foto de Firebase Auth como fallback
      setProfilePhotoURL(currentUser.photoURL);
    } finally {
      setLoading(false);
    }
  };

  // Cargar el perfil cuando cambia el usuario o se fuerza una recarga
  useEffect(() => {
    loadUserProfile();
  }, [currentUser, reloadCounter]);

  // Limpiar el timeout cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
  }, []);

  return {
    profilePhotoURL,
    loading,
    error,
    // Función para actualizar la foto de perfil en el estado local
    updateProfilePhoto: (newPhotoURL: string) => {
      console.log('useUserProfile: Actualizando foto de perfil en estado local');
      setProfilePhotoURL(newPhotoURL);
    },
    // Función para forzar una recarga del perfil con debounce
    reloadProfile: () => {
      // Si ya está recargando, no hacer nada
      if (isReloading) {
        console.log('useUserProfile: Ya está recargando, ignorando llamada');
        return;
      }
      
      console.log('useUserProfile: Programando recarga del perfil (debounce)');
      
      // Cancelar cualquier timeout existente
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
      
      // Marcar como recargando
      setIsReloading(true);
      
      // Programar la recarga con un debounce de 300ms
      reloadTimeoutRef.current = setTimeout(() => {
        console.log('useUserProfile: Ejecutando recarga del perfil');
        setReloadCounter(prev => prev + 1);
        setIsReloading(false);
        reloadTimeoutRef.current = null;
      }, 300);
    }
  };
}