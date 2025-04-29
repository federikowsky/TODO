import React, { useMemo } from 'react';
import { ASTNode } from '../../core/services/tdParser/types';
import { FilterOptions, FilterManager } from '../../core/services/tdParser/FilterManager';
import ResultsList from './ResultsList';

interface ResultsSectionProps {
  filters: FilterOptions;
  filterManager: FilterManager;
  ast: ASTNode | null;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ filters, filterManager, ast }) => {
  const filteredTree: ASTNode | null = useMemo(() => {
    if (!ast) return null;
    return filterManager.getFilteredTree(ast, filters);
  }, [ast, filters, filterManager]);

  return (
    <div className="results-section">
      <h3>Risultati filtrati</h3>
      {filteredTree ? (
        <ResultsList node={filteredTree} />
      ) : (
        <div>Nessun risultato</div>
      )}
    </div>
  );
};

export default ResultsSection;