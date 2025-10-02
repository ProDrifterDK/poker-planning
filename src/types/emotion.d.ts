import '@emotion/react';
import { Theme as MuiTheme } from '@mui/material/styles';
import { darkEmotionTheme } from '../styles/theme';

type CustomTheme = MuiTheme & typeof darkEmotionTheme;

declare module '@emotion/react' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
  export interface Theme extends CustomTheme {}
}