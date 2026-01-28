'use client';

import React from 'react';
import NextLink from 'next/link';
import { Link, LinkProps } from '@mui/material';

export type NextMuiLinkProps = LinkProps & { 
  href: string;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
};

export default function NextMuiLink(props: NextMuiLinkProps) {
  return <Link component={NextLink} {...props} />;
}
