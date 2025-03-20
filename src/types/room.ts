import { UserRole } from './roles';

export interface Participant {
  id: string;
  name: string;
  estimation?: number | string;
  role: UserRole;
  userId?: string; // ID del usuario autenticado (si está disponible)
}

export interface Room {
  id: string;
  participants: Participant[];
  creatorId?: string; // ID del usuario que creó la sala
  settings?: RoomSettings;
  revealed: boolean; // Indica si las cartas están reveladas
}

export interface RoomSettings {
  seriesType: 'fibonacci' | 'tshirt' | 'powers2' | 'days';
  autoReveal: boolean; // Revelar automáticamente cuando todos hayan votado
  allowSpectators: boolean; // Permitir espectadores (sin voto)
  showAverage: boolean; // Mostrar promedio de estimaciones
}
