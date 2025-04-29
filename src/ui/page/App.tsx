import React, { useState } from 'react';
import { ASTProvider } from '../context/ASTProvider';
import Sidebar from '../sidebar/Sidebar';
import { FilterManager, FilterOptions } from '../../core/services/tdParser/FilterManager';
import { ASTNode } from '../../core/services/tdParser/types';

interface AppProps {
  initialAst: ASTNode | null;
}

const App: React.FC<AppProps> = ({ initialAst }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    sections: false,
    metaTag: undefined,
    status: undefined,
    priority: undefined,
    hasNotes: false,
    search: '',
  });

  const filterManager = new FilterManager();

  return (
    <ASTProvider initialAst={initialAst}>
      <Sidebar filters={filters} onFilterChange={setFilters} filterManager={filterManager} />
    </ASTProvider>
  );
};

export default App;