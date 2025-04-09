// src/components/FilterPanel.tsx
import React from 'react';
import { FilterOptions } from '../../core/services/tdParser/FilterManager';

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange }) => {
  const handleCheckboxChange = (name: keyof FilterOptions, value: boolean) => {
    onFilterChange({ ...filters, [name]: value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({ ...filters, status: value === 'none' ? undefined : (value as 'todo' | 'done') });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({ ...filters, priority: value === 'none' ? undefined : (value as 'none' | 'low' | 'medium' | 'high') });
  };

  const handleMetaKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value.trim();
    onFilterChange({ ...filters, metaTag: key ? { key, value: filters.metaTag?.value } : undefined });
  };

  const handleMetaValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (filters.metaTag) {
      onFilterChange({ ...filters, metaTag: { key: filters.metaTag.key, value: value || undefined } });
    } else {
      onFilterChange({ ...filters, metaTag: { key: '', value: value || undefined } });
    }
  };

  return (
    <div className="filter-panel">
      <h3>Filtri</h3>
      <div>
        <label>
          <input
            type="checkbox"
            checked={filters.sections || false}
            onChange={(e) => handleCheckboxChange('sections', e.target.checked)}
          />
          Includi Sezioni
        </label>
      </div>
      <div>
        <label>
          Status:
          <select value={filters.status || 'none'} onChange={handleStatusChange}>
            <option value="none">Tutti</option>
            <option value="todo">Todo</option>
            <option value="done">Done</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Priorità:
          <select value={filters.priority || 'none'} onChange={handlePriorityChange}>
            <option value="none">Tutte</option>
            <option value="low">Bassa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Ha Note:
          <input
            type="checkbox"
            checked={filters.hasNotes || false}
            onChange={(e) => handleCheckboxChange('hasNotes', e.target.checked)}
          />
        </label>
      </div>
      <div>
        <label>
          Meta Tag Key:
          <input type="text" value={filters.metaTag?.key || ''} onChange={handleMetaKeyChange} />
        </label>
      </div>
      <div>
        <label>
          Meta Tag Value:
          <input type="text" value={filters.metaTag?.value?.toString() || ''} onChange={handleMetaValueChange} />
        </label>
      </div>
    </div>
  );
};

export default FilterPanel;