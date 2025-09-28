'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { emotionTheme } from '../styles/theme';
import Link from 'next/link';

// Styled components using the design system
const FooterContainer = styled.footer`
  background-color: ${emotionTheme.colors.background.paper};
  border-top: 1px solid ${emotionTheme.colors.border.main};
  padding: ${emotionTheme.spacing(12)} 0 ${emotionTheme.spacing(6)};
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${emotionTheme.spacing(4)};
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: ${emotionTheme.spacing(8)};

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr 1fr;
    gap: ${emotionTheme.spacing(6)};
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${emotionTheme.spacing(6)};
    text-align: center;
  }
`;

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${emotionTheme.spacing(3)};
`;

const FooterTitle = styled.h3`
  font-family: ${emotionTheme.typography.fontFamily.heading};
  font-size: ${emotionTheme.typography.fontSizes.body};
  font-weight: ${emotionTheme.typography.fontWeights.bold};
  color: ${emotionTheme.colors.text.primary};
  margin: 0;
  margin-bottom: ${emotionTheme.spacing(2)};
`;

const FooterLink = styled(Link)`
  color: ${emotionTheme.colors.text.secondary};
  text-decoration: none;
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.body};
  line-height: 1.6;
  transition: color 0.2s ease;

  &:hover {
    color: ${emotionTheme.colors.primary.main};
  }
`;

const CompanyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${emotionTheme.spacing(2)};
`;

const CompanyName = styled.h2`
  font-family: ${emotionTheme.typography.fontFamily.heading};
  font-size: ${emotionTheme.typography.fontSizes.h4};
  font-weight: ${emotionTheme.typography.fontWeights.bold};
  color: ${emotionTheme.colors.text.primary};
  margin: 0;
  background: linear-gradient(135deg, ${emotionTheme.colors.primary.main}, ${emotionTheme.colors.secondary.main});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const CompanyDescription = styled.p`
  color: ${emotionTheme.colors.text.secondary};
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.body};
  line-height: 1.6;
  margin: 0;
  max-width: 300px;
`;

const SocialSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${emotionTheme.spacing(3)};
`;

const SocialLinks = styled.div`
  display: flex;
  gap: ${emotionTheme.spacing(3)};

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: ${emotionTheme.colors.background.default};
  border: 1px solid ${emotionTheme.colors.border.main};
  border-radius: ${emotionTheme.borderRadius.medium};
  color: ${emotionTheme.colors.text.secondary};
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${emotionTheme.colors.primary.main};
    border-color: ${emotionTheme.colors.primary.main};
    color: ${emotionTheme.colors.text.primary};
    transform: translateY(-2px);
  }
`;

const BottomSection = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${emotionTheme.spacing(6)} ${emotionTheme.spacing(4)} 0;
  border-top: 1px solid ${emotionTheme.colors.border.main};
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: ${emotionTheme.spacing(4)};
    text-align: center;
  }
`;

const Copyright = styled.p`
  color: ${emotionTheme.colors.text.secondary};
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.caption};
  margin: 0;
`;

const LegalLinks = styled.div`
  display: flex;
  gap: ${emotionTheme.spacing(4)};

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const LegalLink = styled(Link)`
  color: ${emotionTheme.colors.text.secondary};
  text-decoration: none;
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.caption};
  transition: color 0.2s ease;

  &:hover {
    color: ${emotionTheme.colors.primary.main};
  }
`;

// Social media icon component (using simple text for now, can be replaced with icon library later)
const SocialIcon: React.FC<{ href: string; label: string; children: React.ReactNode }> = ({
  href,
  label,
  children
}) => (
  <SocialLink href={href} aria-label={label} target="_blank" rel="noopener noreferrer">
    {children}
  </SocialLink>
);

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
    { href: 'https://twitter.com/pokerplanningpro', labelKey: 'footer.social.twitter', symbol: '𝕏' },
    { href: 'https://github.com/pokerplanningpro', labelKey: 'footer.social.github', symbol: 'GH' },
    { href: 'https://linkedin.com/company/pokerplanningpro', labelKey: 'footer.social.linkedin', symbol: 'in' },
    { href: 'https://discord.gg/pokerplanningpro', labelKey: 'footer.social.discord', symbol: 'DC' },
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
      </FooterContent>

      <SocialSection>
        <FooterTitle>{t('footer.followUsTitle')}</FooterTitle>
        <SocialLinks>
          {footerData.social.map((social) => (
            <SocialIcon
              key={social.href}
              href={social.href}
              label={t(social.labelKey)}
            >
              {social.symbol}
            </SocialIcon>
          ))}
        </SocialLinks>
      </SocialSection>

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
