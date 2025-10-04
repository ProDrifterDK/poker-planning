import React from 'react';

interface CreateRoomPanelProps {
    onCreateRoom: (name: string, roomTitle: string, selectedSeries: string) => void;
}

const CreateRoomPanel: React.FC<CreateRoomPanelProps> = ({ onCreateRoom }) => {
  // Form for creating a room will be implemented here
  return <div>Create Room Panel</div>;
};

export default CreateRoomPanel;