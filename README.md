# Planning Poker Pro

Una aplicación de Planning Poker para estimación ágil de tareas, desarrollada con Next.js, TypeScript, Material-UI y Firebase.

## Características

- Creación de salas con código único
- Diferentes series de estimación (Fibonacci, T-Shirt, Powers of 2, Days)
- Votación en tiempo real
- Revelación sincronizada de votos
- Cálculo automático de promedios
- Gestión de issues
- Soporte para temas claro/oscuro

## Tecnologías

- **Frontend**: Next.js 15 con TypeScript
- **UI**: Material-UI (MUI)
- **Estado**: Zustand para gestión de estado global
- **Backend**: Firebase Realtime Database
- **Testing**: Jest, React Testing Library, Cypress

## Comenzando

### Requisitos previos

- Node.js 18.0 o superior
- npm 9.0 o superior

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/planning-poker-pro.git
   cd planning-poker-pro
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=tu-database-url
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Testing

El proyecto incluye tests unitarios, de integración y end-to-end.

### Tests unitarios y de integración

Ejecutar todos los tests:
```bash
npm test
```

Ejecutar tests en modo watch:
```bash
npm run test:watch
```

Generar informe de cobertura:
```bash
npm run test:coverage
```

### Tests end-to-end

Abrir Cypress en modo interactivo:
```bash
npm run cypress
```

Ejecutar tests de Cypress en modo headless:
```bash
npm run cypress:headless
```

Ejecutar tests de Cypress con servidor de desarrollo:
```bash
npm run cypress:ci
```

## Estructura del proyecto

```
├── __tests__/              # Tests unitarios y de integración
│   ├── unit/               # Tests unitarios
│   ├── integration/        # Tests de integración
│   └── mocks/              # Mocks para testing
├── cypress/                # Tests end-to-end
├── public/                 # Archivos estáticos
├── src/
│   ├── app/                # Rutas y páginas (Next.js App Router)
│   ├── components/         # Componentes React
│   ├── context/            # Contextos de React
│   ├── lib/                # Utilidades y configuraciones
│   ├── store/              # Stores de Zustand
│   ├── styles/             # Estilos globales
│   └── types/              # Definiciones de TypeScript
├── .env.local              # Variables de entorno locales
├── jest.config.js          # Configuración de Jest
├── jest.setup.js           # Configuración de setup para Jest
└── cypress.config.js       # Configuración de Cypress
```

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.
