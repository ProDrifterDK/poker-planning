import React from 'react';
import styled from '@emotion/styled';
import { emotionTheme } from '../styles/theme';

// Styled container for the information card
const CardContainer = styled.div`
  background-color: ${emotionTheme.colors.background.paper};
  border: 1px solid ${emotionTheme.colors.border.main};
  border-radius: ${emotionTheme.borderRadius.large};
  padding: ${emotionTheme.spacing(6)};
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    border-color: ${emotionTheme.colors.primary.main};
    box-shadow: ${emotionTheme.shadows.primaryGlow};
  }

  &:focus-within {
    border-color: ${emotionTheme.colors.primary.main};
    box-shadow: ${emotionTheme.shadows.primaryGlow};
  }
`;

// Styled container for the icon/image area
const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${emotionTheme.spacing(4)};
  min-height: 64px;

  img, svg {
    max-width: 100%;
    height: auto;
  }
`;

// Styled title with bold typography
const CardTitle = styled.h3`
  font-family: ${emotionTheme.typography.fontFamily.heading};
  font-size: ${emotionTheme.typography.fontSizes.h4};
  font-weight: ${emotionTheme.typography.fontWeights.bold};
  line-height: ${emotionTheme.typography.lineHeights.heading};
  color: ${emotionTheme.colors.text.primary};
  margin: 0 0 ${emotionTheme.spacing(3)} 0;
`;

// Styled body text
const CardText = styled.p`
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.body};
  line-height: ${emotionTheme.typography.lineHeights.body};
  color: ${emotionTheme.colors.text.secondary};
  margin: 0;
`;

// InformationCard component props interface
export interface InformationCardProps {
  icon?: React.ReactNode;
  title: string;
  text: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  'aria-label'?: string;
}

// Main InformationCard component
export const InformationCard: React.FC<InformationCardProps> = ({
  icon,
  title,
  text,
  onClick,
  className,
  'aria-label': ariaLabel,
}) => {
  return (
    <CardContainer
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }}
    >
      {icon && <IconContainer>{icon}</IconContainer>}
      <CardTitle>{title}</CardTitle>
      <CardText>{text}</CardText>
    </CardContainer>
  );
};

export default InformationCard;