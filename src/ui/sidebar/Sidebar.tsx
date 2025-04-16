import React from 'react';
import FilterHeader from './FilterHeader';
import FilterSearchBar from './FilterSearchBar';
import FilterPanel from './FilterPanel';
import ResultsSection from './ResultsSection';
import { FilterOptions, FilterManager } from '../../core/services/tdParser/FilterManager';
import { useAST } from '../context/ASTProvider';

export interface SidebarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  filterManager: FilterManager;
}

/**
 * Sidebar: struttura esattamente come l'HTML originale,
 * suddivisa in macro-sezioni (header, search bar, panel e results).
 * Sincronizza automaticamente i risultati con l'AST corrente tramite context.
 */
const Sidebar: React.FC<SidebarProps> = ({ filters, onFilterChange, filterManager }) => {
  const { ast } = useAST();

  // Funzione di reset: ripristina i filtri ai valori di default
  const resetFilters = () => {
    onFilterChange({
      search: '',
      sections: false,
      metaTag: undefined,
      status: undefined,
      priority: undefined,
      hasNotes: false,
    });
  };

  return (
    <div className="sidebar">
      <div className="filter-container">
        <FilterHeader filters={filters} onReset={resetFilters} />
        <FilterSearchBar 
          search={filters.search || ''}
          onSearchChange={(value) => onFilterChange({ ...filters, search: value })}
        />
        <FilterPanel filters={filters} onFilterChange={onFilterChange} />
      </div>
      <div className="sidebar-divider"></div>
      <ResultsSection filters={filters} filterManager={filterManager} ast={ast} />
    </div>
  );
};

export default Sidebar;