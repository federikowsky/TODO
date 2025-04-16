import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ASTNode } from '../../core/services/tdParser/types';

interface ASTContextValue {
  ast: ASTNode | null;
}

const ASTContext = createContext<ASTContextValue>({
  ast: null,
});

export const ASTProvider: React.FC<{ initialAst: ASTNode | null; children: ReactNode }> = ({ initialAst, children }) => {
  const [ast, setAst] = useState<ASTNode | null>(initialAst);

  // Gestione live update direttamente nel provider
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'ast-update') {
        setAst(event.data.ast);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <ASTContext.Provider value={{ ast }}>
      {children}
    </ASTContext.Provider>
  );
};

export const useAST = () => useContext(ASTContext);