// src/types/room.ts

export interface Participant {
  id: string;
  name: string;
  estimation?: number;
}

export interface Room {
  id: string;
  participants: Participant[];
}
