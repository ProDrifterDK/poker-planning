import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

const HotspotWrapper = styled(motion.div)`
  position: absolute;
  z-index: 1400;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HotspotCircle = styled(motion.div)`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary.main};
  cursor: pointer;
`;

interface HotspotProps {
  top?: string | number;
  left?: string | number;
  right?: string | number;
  bottom?: string | number;
  onClick: () => void;
}

const Hotspot: React.FC<HotspotProps> = ({ top, left, right, bottom, onClick }) => {
  return (
    <HotspotWrapper
      style={{ top, left, right, bottom }}
      onClick={onClick}
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
    >
      <HotspotCircle
        whileHover={{ scale: 1.5 }}
        whileTap={{ scale: 0.8 }}
      />
    </HotspotWrapper>
  );
};

export default Hotspot;