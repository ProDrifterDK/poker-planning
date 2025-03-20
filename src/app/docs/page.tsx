import React from 'react';
import { Typography, Container, Paper, Box, List, ListItem, ListItemText, ListItemIcon, Breadcrumbs, Link } from '@mui/material';
import NextLink from 'next/link';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import BuildIcon from '@mui/icons-material/Build';
import SecurityIcon from '@mui/icons-material/Security';
import InfoIcon from '@mui/icons-material/Info';

export default function DocsPage() {
    const documentationSections = [
        {
            title: 'Solución de Problemas',
            description: 'Guía para resolver problemas comunes, incluyendo problemas con bloqueadores de anuncios.',
            icon: <BuildIcon />,
            link: '/docs/troubleshooting'
        },
        {
            title: 'Guía de Usuario',
            description: 'Aprende a usar todas las funciones de Poker Planning.',
            icon: <HelpOutlineIcon />,
            link: '/docs/user-guide'
        },
        {
            title: 'Roles y Permisos',
            description: 'Información sobre los diferentes roles y sus permisos en la aplicación.',
            icon: <SecurityIcon />,
            link: '/docs/roles-and-permissions'
        },
        {
            title: 'Acerca de',
            description: 'Información sobre la aplicación, versión y tecnologías utilizadas.',
            icon: <InfoIcon />,
            link: '/docs/about'
        }
    ];

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box mb={4}>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link component={NextLink} href="/" color="inherit">
                        Inicio
                    </Link>
                    <Typography color="text.primary">Documentación</Typography>
                </Breadcrumbs>
            </Box>

            <Typography variant="h4" component="h1" gutterBottom>
                Documentación
            </Typography>

            <Typography variant="body1" paragraph>
                Bienvenido a la documentación de Poker Planning. Aquí encontrarás guías, tutoriales y soluciones a problemas comunes.
            </Typography>

            <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
                <List>
                    {documentationSections.map((section, index) => (
                        <ListItem
                            key={index}
                            component={NextLink}
                            href={section.link}
                            sx={{
                                borderBottom: index < documentationSections.length - 1 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                }
                            }}
                        >
                            <ListItemIcon>
                                {section.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={section.title}
                                secondary={section.description}
                                primaryTypographyProps={{ fontWeight: 'bold' }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Container>
    );
}