import React from 'react';
import { Grid, Divider, Box, useTheme, useMediaQuery } from '@mui/material';

interface SplitScreenLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({ leftPanel, rightPanel }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return (
      <Box sx={{ width: '100%', p: 2 }}>
        <Box mb={4}>{leftPanel}</Box>
        <Divider />
        <Box mt={4}>{rightPanel}</Box>
      </Box>
    );
  }

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      <Grid
        item
        xs={12}
        md={5} // Approximately 40%
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          transition: 'background-color 0.3s ease',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        {leftPanel}
      </Grid>
      <Divider orientation="vertical" flexItem />
      <Grid
        item
        xs={12}
        md={6.9} // Approximately 60%
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          transition: 'background-color 0.3s ease',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        {rightPanel}
      </Grid>
    </Grid>
  );
};

export default SplitScreenLayout;