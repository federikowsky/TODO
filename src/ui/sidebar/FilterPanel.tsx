// src/ui/sidebar/FilterPanel.tsx
import React from 'react';
import { FilterOptions } from '../../core/services/tdParser/FilterManager';
import FilterRow from './FilterRow';
import MetaInput from './MetaInput';

export interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

/**
 * FilterPanel: rappresenta il pannello con i controlli filtri,
 * riproducendo esattamente le righe dell'HTML originale.
 */
const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange }) => {
  const handleCheckboxChange = (name: keyof FilterOptions, value: boolean) => {
    onFilterChange({ ...filters, [name]: value });
  };

  const handleSelectChange = (name: 'status' | 'priority', value: string) => {
    onFilterChange({ ...filters, [name]: value === 'none' ? undefined : value });
  };

  const handleMetaKeyChange = (value: string) => {
    onFilterChange({ ...filters, metaTag: value ? { key: value, value: filters.metaTag?.value } : undefined });
  };

  const handleMetaValueChange = (value: string) => {
    if (filters.metaTag) {
      onFilterChange({ ...filters, metaTag: { key: filters.metaTag.key, value: value || undefined } });
    } else {
      onFilterChange({ ...filters, metaTag: { key: '', value: value || undefined } });
    }
  };

  return (
    <div className="filter-panel-wrapper" id="filterWrapper">
      <div className="filter-panel">
        <FilterRow>
          <div className="inline-checkbox">
            <input type="checkbox" id="includeSections" checked={filters.sections || false} onChange={(e) => handleCheckboxChange('sections', e.target.checked)}/>
            <label htmlFor="includeSections">Includi Sezioni</label>
          </div>
        </FilterRow>
        <FilterRow>
          <div className="inline-checkbox">
            <input type="checkbox" id="hasNotes" checked={filters.hasNotes || false} onChange={(e) => handleCheckboxChange('hasNotes', e.target.checked)}/>
            <label htmlFor="hasNotes">Ha Note</label>
          </div>
        </FilterRow>
        <FilterRow>
          <label htmlFor="status" className="full-width-label"><span>Status</span></label>
          <select id="status" value={filters.status || 'none'} onChange={(e) => handleSelectChange('status', e.target.value)}>
            <option value="none">Tutti</option>
            <option value="todo">Todo</option>
            <option value="done">Done</option>
          </select>
        </FilterRow>
        <FilterRow>
          <label htmlFor="priority" className="full-width-label"><span>Priorità</span></label>
          <select id="priority" value={filters.priority || 'none'} onChange={(e) => handleSelectChange('priority', e.target.value)}>
            <option value="none">Tutte</option>
            <option value="low">Bassa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </FilterRow>
        <FilterRow>
          <label htmlFor="metaInput" className="full-width-label"><span>Meta</span></label>
          <MetaInput 
            metaKey={filters.metaTag?.key || ''} 
            onMetaKeyChange={handleMetaKeyChange}
            onMetaValueChange={handleMetaValueChange}
            metaValue={filters.metaTag?.value?.toString() || ''}
          />
        </FilterRow>
      </div>
    </div>
  );
};

export default FilterPanel;