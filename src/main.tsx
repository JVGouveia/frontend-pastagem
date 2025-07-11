import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import './index.css'
import { Amplify } from 'aws-amplify'
import config from './config/amplify'

// Configurar o Amplify com as configurações do arquivo
Amplify.configure(config)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
