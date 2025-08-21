"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { SearchFilters, localSearch } from '../utils/searchApi';

interface AdvancedSearchProps {
  applications: any[];
  onSearchResults: (results: any[]) => void;
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  applications,
  onSearchResults,
  onFiltersChange,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() || Object.keys(filters).length > 0) {
        performSearch();
      } else {
        onSearchResults(applications);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filters]);

  const performSearch = useCallback(() => {
    setIsSearching(true);
    
    try {
      const results = localSearch(applications, searchQuery, filters);
      onSearchResults(results.results);
      
      // Add to search history
      if (searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
        setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, filters, applications, onSearchResults, searchHistory]);

  const handleFilterChange = (key: keyof SearchFilters, value: string | undefined) => {
    const newFilters = { ...filters };
    
    if (value && value.trim()) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilters({});
    onSearchResults(applications);
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.trim();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Şirket, pozisyon, konum veya açıklama ara..."
          className="w-full pl-10 pr-12 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white font-medium"
        />
        
        {/* Search Actions */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {hasActiveFilters && (
            <button
              onClick={clearSearch}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Aramayı temizle"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-md transition-colors ${
              showFilters 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Filtreleri göster/gizle"
          >
            <FunnelIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Status */}
      {isSearching && (
        <div className="flex items-center justify-center py-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span className="text-sm text-gray-600">Aranıyor...</span>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && !searchQuery && (
        <div className="flex flex-wrap gap-2">
          {searchHistory.map((term, index) => (
            <button
              key={index}
              onClick={() => setSearchQuery(term)}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Gelişmiş Filtreler</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <CheckCircleIcon className="inline h-3 w-3 mr-1" />
                Durum
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tümü</option>
                <option value="active">Aktif</option>
                <option value="pending">Beklemede</option>
                <option value="finished">Tamamlandı</option>
                <option value="rejected">Reddedildi</option>
                <option value="accepted">Kabul Edildi</option>
              </select>
            </div>

            {/* Stage Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <ClockIcon className="inline h-3 w-3 mr-1" />
                Aşama
              </label>
              <select
                value={filters.stage || ''}
                onChange={(e) => handleFilterChange('stage', e.target.value || undefined)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tümü</option>
                <option value="Başvuruldu">Başvuruldu</option>
                <option value="İlk Değerlendirme">İlk Değerlendirme</option>
                <option value="Teknik Test">Teknik Test</option>
                <option value="Mülakat">Mülakat</option>
                <option value="Final Mülakat">Final Mülakat</option>
                <option value="İş Teklifi">İş Teklifi</option>
              </select>
            </div>

            {/* Company Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <BuildingOfficeIcon className="inline h-3 w-3 mr-1" />
                Şirket
              </label>
              <input
                type="text"
                value={filters.company || ''}
                onChange={(e) => handleFilterChange('company', e.target.value || undefined)}
                placeholder="Şirket adı..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Position Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <BriefcaseIcon className="inline h-3 w-3 mr-1" />
                Pozisyon
              </label>
              <input
                type="text"
                value={filters.position || ''}
                onChange={(e) => handleFilterChange('position', e.target.value || undefined)}
                placeholder="Pozisyon adı..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <CalendarIcon className="inline h-3 w-3 mr-1" />
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <CalendarIcon className="inline h-3 w-3 mr-1" />
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Arama: {searchQuery}
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {Object.entries(filters).map(([key, value]) => (
                  <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {key}: {value}
                    <button
                      onClick={() => handleFilterChange(key as keyof SearchFilters, undefined)}
                      className="ml-1 text-gray-600 hover:text-gray-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
