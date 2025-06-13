# Frontend Pastagem

Este é o frontend da aplicação de gerenciamento de pastagens, desenvolvido com React, TypeScript e Vite.

## Requisitos

- Node.js 16.x ou superior
- npm 7.x ou superior

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```
VITE_AWS_REGION=sua-regiao
VITE_AWS_USER_POOL_ID=seu-user-pool-id
VITE_AWS_CLIENT_ID=seu-client-id
VITE_API_URL=http://localhost:8080
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Estrutura do Projeto

- `src/components/` - Componentes React
- `src/config/` - Configurações (AWS Amplify, etc.)
- `src/App.tsx` - Componente principal e rotas
- `src/main.tsx` - Ponto de entrada da aplicação

## Funcionalidades

- Autenticação via AWS Cognito
- Dashboard com dados de pastagens e propriedades
- Integração com APIs Spring Boot e Node.js
- Interface responsiva com Tailwind CSS

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera a build de produção
- `npm run preview` - Visualiza a build de produção localmente

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
