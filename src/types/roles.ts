/**
 * Tipos de roles disponibles en la aplicación
 */
export enum UserRole {
  MODERATOR = 'moderator',
  PARTICIPANT = 'participant',
}

/**
 * Permisos disponibles en la aplicación
 */
export enum Permission {
  // Permisos de sala
  CREATE_ROOM = 'create_room',
  JOIN_ROOM = 'join_room',
  
  // Permisos de moderador
  REVEAL_CARDS = 'reveal_cards',
  RESET_VOTING = 'reset_voting',
  KICK_USER = 'kick_user',
  CHANGE_ROOM_SETTINGS = 'change_room_settings',
  END_SESSION = 'end_session',
  MANAGE_TIMER = 'manage_timer',
  
  // Permisos de participante
  VOTE = 'vote',
  CHANGE_OWN_NAME = 'change_own_name',
}

/**
 * Mapeo de roles a permisos
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.MODERATOR]: [
    Permission.CREATE_ROOM,
    Permission.JOIN_ROOM,
    Permission.REVEAL_CARDS,
    Permission.RESET_VOTING,
    Permission.KICK_USER,
    Permission.CHANGE_ROOM_SETTINGS,
    Permission.END_SESSION,
    Permission.MANAGE_TIMER,
    Permission.VOTE,
    Permission.CHANGE_OWN_NAME,
  ],
  [UserRole.PARTICIPANT]: [
    Permission.CREATE_ROOM,
    Permission.JOIN_ROOM,
    Permission.REVEAL_CARDS,
    Permission.RESET_VOTING,
    Permission.VOTE,
    Permission.CHANGE_OWN_NAME,
  ],
};

/**
 * Interfaz para el usuario con rol
 */
export interface UserWithRole {
  uid: string;
  displayName: string | null;
  email: string | null;
  role: UserRole;
}

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}