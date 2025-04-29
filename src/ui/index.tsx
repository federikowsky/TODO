// src/ui/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './page/App';
import './styles/style.css';

declare global {
  interface Window {
    // Il backend della webview inietta l'AST completo
    initialAst: any;
  }
}

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App initialAst={window.initialAst} />
    </React.StrictMode>
  );
}