import React from 'react';

interface JoinRoomPanelProps {
    onJoinRoom: (roomCode: string) => void;
}

const JoinRoomPanel: React.FC<JoinRoomPanelProps> = ({ onJoinRoom }) => {
  // Form for joining a room will be implemented here
  return <div>Join Room Panel</div>;
};

export default JoinRoomPanel;