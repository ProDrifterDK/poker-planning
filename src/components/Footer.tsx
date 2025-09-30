'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import {
  Twitter,
  Github,
  Linkedin,
  Discord
} from 'iconoir-react';

type IconComponent = React.ComponentType<{ width?: string | number; height?: string | number }>;

// Styled components using the design system
const FooterContainer = styled.footer`
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-top: 1px solid ${({ theme }) => theme.colors.border.main};
  padding: ${({ theme }) => `${theme.spacing(12)} 0 ${theme.spacing(6)}`};
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing(4)};
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing(8)};

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr 1fr;
    gap: ${({ theme }) => theme.spacing(6)};
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing(6)};
    text-align: center;
  }
`;

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const FooterTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: ${({ theme }) => theme.typography.fontSizes.body};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const FooterLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-size: ${({ theme }) => theme.typography.fontSizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
  }
`;

const CompanyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const CompanyName = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: ${({ theme }) => theme.typography.fontSizes.h4};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary.main}, ${({ theme }) => theme.colors.secondary.main});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const CompanyDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-size: ${({ theme }) => theme.typography.fontSizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  margin: 0;
  max-width: 300px;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.spacing(10)};
  height: ${({ theme }) => theme.spacing(10)};
  background-color: ${({ theme }) => theme.colors.background.default};
  border: 1px solid ${({ theme }) => theme.colors.border.main};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  transition: all 0.3s ease-in-out;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(18, 151, 253, 0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover::before {
    left: 100%;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary.main};
    border-color: ${({ theme }) => theme.colors.primary.main};
    color: ${({ theme }) => theme.colors.text.primary};
    transform: translateY(-3px) scale(1.1);
    box-shadow: 0 8px 25px rgba(18, 151, 253, 0.3), 0 4px 12px rgba(18, 151, 253, 0.2);
  }
`;

const BottomSection = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(6)} ${theme.spacing(4)} 0`};
  border-top: 1px solid ${({ theme }) => theme.colors.border.main};
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(4)};
    text-align: center;
  }
`;

const Copyright = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-size: ${({ theme }) => theme.typography.fontSizes.caption};
  margin: 0;
`;

const LegalLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(4)};

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const LegalLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-size: ${({ theme }) => theme.typography.fontSizes.caption};
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
  }
`;

// Social media icon component
const SocialIcon: React.FC<{ href: string; label: string; icon: IconComponent }> = ({
  href,
  label,
  icon: Icon,
}) => {
  const theme = useTheme();
  return (
    <SocialLink href={href} aria-label={label} target="_blank" rel="noopener noreferrer">
      <Icon width={theme.spacing(5)} height={theme.spacing(5)} />
    </SocialLink>
  );
};

const footerData = {
  companyInfo: {
    nameKey: 'footer.companyName',
    descriptionKey: 'footer.companyDescription',
  },
  product: [
    { href: '/features', labelKey: 'footer.navigation.features' },
    { href: '/pricing', labelKey: 'footer.navigation.pricing' },
    { href: '/demo', labelKey: 'footer.navigation.demo' },
    { href: '/integrations', labelKey: 'footer.navigation.integrations' },
  ],
  company: [
    { href: '/about', labelKey: 'footer.navigation.about' },
    { href: '/blog', labelKey: 'footer.navigation.blog' },
    { href: '/careers', labelKey: 'footer.navigation.careers' },
    { href: '/contact', labelKey: 'footer.navigation.contact' },
  ],
  resources: [
    { href: '/docs', labelKey: 'footer.navigation.docs' },
    { href: '/help', labelKey: 'footer.navigation.help' },
    { href: '/community', labelKey: 'footer.navigation.community' },
    { href: '/api', labelKey: 'footer.navigation.api' },
  ],
  social: [
    { href: 'https://twitter.com/pokerplanningpro', labelKey: 'footer.social.twitter', icon: Twitter },
    { href: 'https://github.com/pokerplanningpro', labelKey: 'footer.social.github', icon: Github },
    { href: 'https://linkedin.com/company/pokerplanningpro', labelKey: 'footer.social.linkedin', icon: Linkedin },
    { href: 'https://discord.gg/pokerplanningpro', labelKey: 'footer.social.discord', icon: Discord },
  ],
  legal: [
    { href: '/privacy-policy', labelKey: 'footer.legal.privacyPolicy' },
    { href: '/terms', labelKey: 'footer.legal.termsOfService' },
    { href: '/cookies', labelKey: 'footer.legal.cookies' },
    { href: '/security', labelKey: 'footer.legal.security' },
  ],
};

export default function Footer() {
  const { t } = useTranslation();

  return (
    <FooterContainer>
      <FooterContent>
        <CompanyInfo>
          <CompanyName>{t(footerData.companyInfo.nameKey)}</CompanyName>
          <CompanyDescription>{t(footerData.companyInfo.descriptionKey)}</CompanyDescription>
        </CompanyInfo>

        <FooterSection>
          <FooterTitle>{t('footer.productTitle')}</FooterTitle>
          {footerData.product.map((link) => (
            <FooterLink key={link.href} href={link.href}>
              {t(link.labelKey)}
            </FooterLink>
          ))}
        </FooterSection>

        <FooterSection>
          <FooterTitle>{t('footer.companyTitle')}</FooterTitle>
          {footerData.company.map((link) => (
            <FooterLink key={link.href} href={link.href}>
              {t(link.labelKey)}
            </FooterLink>
          ))}
        </FooterSection>

        <FooterSection>
          <FooterTitle>{t('footer.resourcesTitle')}</FooterTitle>
          {footerData.resources.map((link) => (
            <FooterLink key={link.href} href={link.href}>
              {t(link.labelKey)}
            </FooterLink>
          ))}
        </FooterSection>

        <FooterSection>
          <FooterTitle>{t('footer.followUsTitle')}</FooterTitle>
          <SocialLinks>
            {footerData.social.map((social) => (
              <SocialIcon
                key={social.href}
                href={social.href}
                label={t(social.labelKey)}
                icon={social.icon}
              />
            ))}
          </SocialLinks>
        </FooterSection>
      </FooterContent>

      <BottomSection>
        <Copyright>
          © {new Date().getFullYear()} {t(footerData.companyInfo.nameKey)}. {t('footer.copyright')}.
        </Copyright>

        <LegalLinks>
          {footerData.legal.map((link) => (
            <LegalLink key={link.href} href={link.href}>
              {t(link.labelKey)}
            </LegalLink>
          ))}
        </LegalLinks>
      </BottomSection>
    </FooterContainer>
  );
}
