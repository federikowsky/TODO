// src/ui/sidebar/FilterRow.tsx
import React from 'react';

export interface FilterRowProps {
  children: React.ReactNode;
}

/**
 * FilterRow: componente wrapper per ogni riga del pannello filtri.
 */
const FilterRow: React.FC<FilterRowProps> = ({ children }) => {
  return <div className="filter-row">{children}</div>;
};

export default FilterRow;