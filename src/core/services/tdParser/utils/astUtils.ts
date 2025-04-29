import { ASTNode } from '../types';

export function serializeAST(ast: ASTNode | null): string {
    return JSON.stringify(ast, (key, value) => {
      // Escludi il campo "parent" da ogni nodo
      if (key === 'parent') {
        return undefined;
      }
      return value;
    });
  }