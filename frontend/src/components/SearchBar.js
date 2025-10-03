import React, { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ data, searchFields, onSearch, placeholder = "Search..." }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      onSearch(data); // Return all data when search is empty
      return;
    }

    const filteredData = data.filter(item => {
      return searchFields.some(field => {
        const fieldValue = getNestedValue(item, field);
        return fieldValue?.toString().toLowerCase().includes(term.toLowerCase());
      });
    });

    onSearch(filteredData);
  };

  // Helper function to get nested object values
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  return (
    <div className="search-bar">
      <div className="search-input-group">
        <i className="fas fa-search search-icon"></i>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searchTerm && (
          <button
            className="search-clear"
            onClick={() => handleSearch('')}
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;