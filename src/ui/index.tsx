// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './page/App';
import { ASTNode } from '../core/services/tdParser/types';

declare global {
  interface Window {
    initialAst: ASTNode;
  }
}

// L'AST viene iniettato dal backend della webview
const ast: ASTNode = window.initialAst;

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App ast={ast} />
    </React.StrictMode>
  );
}