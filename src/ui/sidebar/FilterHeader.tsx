// src/ui/sidebar/FilterHeader.tsx
import React from 'react';
import { FilterOptions } from '../../core/services/tdParser/FilterManager';

export interface FilterHeaderProps {
  filters: FilterOptions;
  onReset: () => void;
}

/**
 * FilterHeader: visualizza il pulsante "Filtri" con il badge dei filtri attivi
 * e il pulsante di reset.
 */
const FilterHeader: React.FC<FilterHeaderProps> = ({ filters, onReset }) => {
  const activeFilterCount = (): number => {
    let count = 0;
    if (filters.search && filters.search.trim() !== '') count++;
    if (filters.sections) count++;
    if (filters.metaTag && filters.metaTag.key) count++;
    if (filters.status) count++;
    if (filters.priority && filters.priority !== 'none') count++;
    if (filters.hasNotes) count++;
    return count;
  };

  return (
    <div className="filter-header">
      <button className="toggle-button" id="toggleFilters" aria-expanded="true" aria-controls="filterWrapper">
        🎛️ Filtri <span className="filter-badge" id="filterBadge">{activeFilterCount()}</span>
      </button>
      <button className="reset-filters" id="resetFilters" title="Reset filtri" aria-label="Reset filtri" onClick={onReset}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 3a7 7 0 1 1-6.32 4" stroke="#c586c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="3 4 7 4 7 8" stroke="#c586c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
};

export default FilterHeader;