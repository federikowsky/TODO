// src/ui/sidebar/FilterSearchBar.tsx
import React from 'react';

export interface FilterSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

/**
 * FilterSearchBar: input di ricerca (classe "search-bar", id "searchBar")
 */
const FilterSearchBar: React.FC<FilterSearchBarProps> = ({ search, onSearchChange }) => {
  return (
    <input
      type="text"
      className="search-bar"
      id="searchBar"
      placeholder="Cerca..."
      aria-label="Cerca"
      autoComplete="off"
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
    />
  );
};

export default FilterSearchBar;