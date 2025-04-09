// src/components/AstTreeView.tsx
import React from 'react';
import { ASTNode } from '../../core/services/tdParser/types';

interface AstTreeViewProps {
  nodes: ASTNode[];
}

const AstTreeView: React.FC<AstTreeViewProps> = ({ nodes }) => {
  if (!nodes || nodes.length === 0) {
    return <div>Nessun nodo trovato.</div>;
  }
  return (
    <ul>
      {nodes.map((node) => (
        <li key={node.id}>
          <span>{node.text}</span>
          {node.children && node.children.length > 0 && <AstTreeView nodes={node.children} />}
        </li>
      ))}
    </ul>
  );
};

export default AstTreeView;