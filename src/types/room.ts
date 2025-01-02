export interface Participant {
  id: string;
  name: string;
  estimation?: number | string;
}

export interface Room {
  id: string;
  participants: Participant[];
}
