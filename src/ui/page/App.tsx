// src/App.tsx
import React, { useState, useMemo } from 'react';
import FilterPanel from '../components/FilterPanel';
import AstTreeView from '../components/AstTreeView';
import { FilterManager, FilterOptions } from '../../core/services/tdParser/FilterManager';
import { ASTNode } from '../../core/services/tdParser/types';

interface AppProps {
  ast: ASTNode;
}

const App: React.FC<AppProps> = ({ ast }) => {
  // Stato dei filtri, inizializzato con valori di default.
  const [filters, setFilters] = useState<FilterOptions>({
    sections: false,
    metaTag: undefined,
    status: undefined,
    priority: undefined,
    hasNotes: false,
  });

  // Creazione istanza singola del FilterManager
  const filterManager = useMemo(() => new FilterManager(), []);

  // Calcola i nodi filtrati, ricalcolando solo al variare dell’AST o delle opzioni filtro
  const filteredNodes = useMemo(() => filterManager.getFilteredNodes(ast, filters), [ast, filters, filterManager]);

  return (
    <div className="app-container">
      {/* Pannello dei filtri, sia per impostare le opzioni che per modificare il filtering dinamicamente */}
      <FilterPanel filters={filters} onFilterChange={setFilters} />

      {/* Visualizzazione ricorsiva dell’albero filtrato */}
      <AstTreeView nodes={filteredNodes} />
    </div>
  );
};

export default App;