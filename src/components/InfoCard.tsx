import React from 'react';
import styled from '@emotion/styled';
import { Box, SxProps, Theme } from '@mui/material';

// Styled container for the information card
const CardContainer = styled(Box)`
  background-color: ${props => props.theme.colors.background.paper};
  border: 1px solid ${props => props.theme.colors.border.main};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing(6)};
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    border-color: ${props => props.theme.colors.primary.main};
    box-shadow: ${props => props.theme.shadows.primaryGlow};
  }

  &:focus-within {
    border-color: ${props => props.theme.colors.primary.main};
    box-shadow: ${props => props.theme.shadows.primaryGlow};
  }
`;

// Styled container for the icon/image area
const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing(4)};
  min-height: 64px;

  img, svg {
    max-width: 100%;
    height: auto;
  }
`;

// Styled title with bold typography
const CardTitle = styled.h4`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: ${({ theme }) => theme.typography.fontSizes.h4};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  line-height: ${({ theme }) => theme.typography.lineHeights.heading};
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing(3)} 0;
`;

// Styled body text
const CardText = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-size: ${({ theme }) => theme.typography.fontSizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${props => props.theme.colors.text.secondary};
  margin: 0;
`;

// InformationCard component props interface
export interface InformationCardProps {
  icon?: React.ReactNode;
  title: string;
  text?: string;
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  'aria-label'?: string;
  sx?: SxProps<Theme>;
}

// Main InformationCard component
export const InformationCard: React.FC<InformationCardProps> = ({
  icon,
  title,
  text,
  children,
  onClick,
  className,
  'aria-label': ariaLabel,
  sx,
}) => {
  return (
    <CardContainer
      onClick={onClick}
      className={className}
      sx={sx}
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
      {children ? (
        <CardText>{children}</CardText>
      ) : (
        <CardText>{text}</CardText>
      )}
    </CardContainer>
  );
};

export default InformationCard;