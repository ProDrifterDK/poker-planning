import React from 'react';
import styled from 'styled-components';
import { Divider, useTheme, useMediaQuery, Theme } from '@mui/material';

interface SplitScreenLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

const MobileContainer = styled.div<{ theme: Theme }>`
  width: 100%;
  padding: ${({ theme }) => theme.spacing(2)};
`;

const StyledLeftPanelWrapper = styled.section<{ theme: Theme }>`
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const StyledRightPanelWrapper = styled.section<{ theme: Theme }>`
  margin-top: ${({ theme }) => theme.spacing(4)};
`;

const DesktopContainer = styled.main`
  display: flex;
  height: 100vh;
`;

const Panel = styled.section<{ theme: Theme }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(4)};
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
  }
`;

const DesktopLeftPanel = styled(Panel)`
  width: 41.666667%; /* 5/12 for md={5} */
`;

const DesktopRightPanel = styled(Panel)`
  width: 57.5%; /* 6.9 / 12 for md={6.9} */
`;

const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({ leftPanel, rightPanel }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return (
      <MobileContainer theme={theme}>
        <StyledLeftPanelWrapper theme={theme}>{leftPanel}</StyledLeftPanelWrapper>
        <Divider />
        <StyledRightPanelWrapper theme={theme}>{rightPanel}</StyledRightPanelWrapper>
      </MobileContainer>
    );
  }

  return (
    <DesktopContainer>
      <DesktopLeftPanel theme={theme}>{leftPanel}</DesktopLeftPanel>
      <Divider orientation="vertical" flexItem />
      <DesktopRightPanel theme={theme}>{rightPanel}</DesktopRightPanel>
    </DesktopContainer>
  );
};

export default SplitScreenLayout;