'use client';

import React from 'react';
import NextLink from 'next/link';
import { ListItem, ListItemProps } from '@mui/material';

export type NextMuiListItemProps = ListItemProps & { 
  href: string;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
};

export default function NextMuiListItem(props: NextMuiListItemProps) {
  return <ListItem component={NextLink} {...props} />;
}
