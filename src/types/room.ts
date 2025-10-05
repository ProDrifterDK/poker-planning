import { UserRole } from './roles';

export interface Participant {
  id: string;
  name: string;
  estimation?: number | string;
  role: UserRole;
  userId?: string; // ID del usuario autenticado (si está disponible)
  photoURL?: string; // URL de la imagen de perfil del usuario
  active?: boolean; // Indica si el participante está activo en la sala
  removed?: boolean; // Indica si el participante ha sido eliminado
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
  timerEnabled: boolean; // Habilitar temporizador para votaciones
  timerDuration: number; // Duración del temporizador en segundos
}

export interface Issue {
  id: string;
  key: string;
  summary: string;
  createdAt: number;
  status: 'pending' | 'estimated' | 'skipped';
  average?: string | null;
}

export interface Vote {
  value: number | string;
  timestamp: number;
}
