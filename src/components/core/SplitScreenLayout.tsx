"use client";

import React from 'react';
import { Box, Divider, useTheme, useMediaQuery, Grid } from '@mui/material';

interface SplitScreenLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

const PanelWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2.5, md: 4 },
        width: '100%',
        height: '100%',
        transition: 'background-color 0.3s ease',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
      }}
    >
      {children}
    </Box>
  );
};

export default function SplitScreenLayout({ leftPanel, rightPanel }: SplitScreenLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return (
      <Box sx={{ p: 2 }}>
        <PanelWrapper>{leftPanel}</PanelWrapper>
        <Divider sx={{ my: 2.5 }} />
        <PanelWrapper>{rightPanel}</PanelWrapper>
      </Box>
    );
  }

  return (
    <Grid container sx={{ height: 'calc(100vh - 120px)' }}>
      <Grid item xs={12} md={5}>
        <PanelWrapper>{leftPanel}</PanelWrapper>
      </Grid>
      <Divider orientation="vertical" flexItem />
      <Grid item xs={12} md={6.9}>
        <PanelWrapper>{rightPanel}</PanelWrapper>
      </Grid>
    </Grid>
  );
}