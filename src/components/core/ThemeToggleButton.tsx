'use client';

import styled from '@emotion/styled';
import { HalfMoon, SunLight } from 'iconoir-react';
import { useThemeMode } from '../../context/themeContext';
import { useTranslation } from 'react-i18next';

// Styled components
const ToggleButton = styled.button`
    background: transparent;
    border: none;
    border-radius: ${props => props.theme.shape.borderRadius};
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: ${props => props.theme.colors.text.primary};
    transition: all 0.2s ease-in-out;

    &:hover {
        background-color: ${props => props.theme.palette.action.hover};
        transform: scale(1.05);
    }

    &:focus {
        outline: 2px solid ${props => props.theme.colors.primary.main};
        outline-offset: 2px;
    }

    &:focus:not(:focus-visible) {
        outline: none;
    }

    svg {
        width: 20px;
        height: 20px;
        transition: ${props =>
            props.theme.transitions.create(['transform', 'opacity'], {
                duration: props.theme.transitions.duration.short,
            })};
    }
`;

const IconWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
`;

const TooltipWrapper = styled.div`
    position: relative;
    display: inline-block;
`;

const TooltipText = styled.div`
    visibility: hidden;
    opacity: 0;
    position: absolute;
    top: 125%;
    left: 50%;
    transform: translateX(-50%);
    background-color: ${props => props.theme.colors.background.paper};
    color: ${props => props.theme.colors.text.primary};
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
    transition: ${props =>
        props.theme.transitions.create(['opacity', 'visibility'], {
            duration: props.theme.transitions.duration.short,
        })};
    border: 1px solid ${props => props.theme.colors.border.main};

    &::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: transparent transparent ${props => props.theme.colors.background.paper} transparent;
    }

    ${ToggleButton}:hover + & {
        visibility: visible;
        opacity: 1;
    }
`;

export default function ThemeToggleButton() {
    const { toggleTheme, mode } = useThemeMode();
    const { t } = useTranslation('common');

    const tooltipText = t('theme.switchTo', {
        mode: mode === 'light'
            ? t('theme.dark')
            : t('theme.light')
    });

    return (
        <TooltipWrapper>
            <ToggleButton
                onClick={toggleTheme}
                aria-label={tooltipText}
                title={tooltipText}
            >
                <IconWrapper>
                    <HalfMoon
                        style={{
                            opacity: mode === 'light' ? 1 : 0,
                            transform: mode === 'light' ? 'rotate(0deg)' : 'rotate(-90deg)',
                        }}
                    />
                    <SunLight
                        style={{
                            opacity: mode === 'dark' ? 1 : 0,
                            transform: mode === 'dark' ? 'rotate(0deg)' : 'rotate(90deg)',
                            position: 'absolute',
                        }}
                    />
                </IconWrapper>
            </ToggleButton>
            <TooltipText>{tooltipText}</TooltipText>
        </TooltipWrapper>
    );
}
