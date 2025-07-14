import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import SkeletonLoader from './SkeletonLoader';
import EmptyState from './EmptyState';
import MobileTable from './MobileTable';
import MobileModal from './MobileModal';
import { useDebounce } from '../hooks/useDebounce';

interface PropertyInfo {
  id: string;
  propertyAddress: string;
  mailingAddress: string;
  appraisal: string;
  owner: string;
  size: string;
  parcelId: string;
  dateAdded: string;
  [key: string]: unknown;
}

interface LeadsDashboardProps {
  onBackToLanding: () => void;
}

const LeadsDashboard: React.FC<LeadsDashboardProps> = ({ onBackToLanding }) => {
  const [leads, setLeads] = useState<PropertyInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'high-value'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'appraisal' | 'address'>('date');
  const [viewModalLead, setViewModalLead] = useState<PropertyInfo | null>(null);
  const [deleteConfirmLead, setDeleteConfirmLead] = useState<PropertyInfo | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - in a real app, this would come from a database
  useEffect(() => {
    const mockLeads: PropertyInfo[] = [
      {
        id: '1',
        propertyAddress: '1712 MOODY',
        mailingAddress: '1712 MOODY ST, HOUSTON, TX 77009',
        appraisal: '$150,000',
        owner: 'BENNETT CLARA MRS ESTATE OF',
        size: '5,000 sqft',
        parcelId: '0311370000012',
        dateAdded: '2024-01-15'
      },
      {
        id: '2',
        propertyAddress: '1234 MAIN ST',
        mailingAddress: '1234 MAIN ST, HOUSTON, TX 77002',
        appraisal: '$250,000',
        owner: 'SMITH JOHN A',
        size: '7,500 sqft',
        parcelId: '0311370000013',
        dateAdded: '2024-01-14'
      },
      {
        id: '3',
        propertyAddress: '5678 OAK AVE',
        mailingAddress: '5678 OAK AVE, HOUSTON, TX 77003',
        appraisal: '$180,000',
        owner: 'JOHNSON MARY L',
        size: '6,200 sqft',
        parcelId: '0311370000014',
        dateAdded: '2024-01-13'
      }
    ];
    // Load data immediately for better performance
    setLeads(mockLeads);
    setLoading(false);
  }, []);

  const filteredLeads = useMemo(() => {
    if (!debouncedSearchTerm && filterBy === 'all') {
      return leads; // Skip filtering if no search term and no filter
    }
    
    return leads.filter(lead => {
      const matchesSearch = !debouncedSearchTerm || 
        lead.propertyAddress.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        lead.owner.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        lead.parcelId.includes(debouncedSearchTerm);
      
      if (filterBy === 'recent') {
        const date = new Date(lead.dateAdded);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return matchesSearch && date > weekAgo;
      }
      
      if (filterBy === 'high-value') {
        const value = parseInt(lead.appraisal.replace(/[$,]/g, ''));
        return matchesSearch && value > 200000;
      }
      
      return matchesSearch;
    });
  }, [leads, debouncedSearchTerm, filterBy]);

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case 'appraisal':
          const aValue = parseInt(a.appraisal.replace(/[$,]/g, ''));
          const bValue = parseInt(b.appraisal.replace(/[$,]/g, ''));
          return bValue - aValue;
        case 'address':
          return a.propertyAddress.localeCompare(b.propertyAddress);
        default:
          return 0;
      }
    });
  }, [filteredLeads, sortBy]);

  const handleExportAll = () => {
    const csv = Papa.unparse(sortedLeads.map(lead => ({
      'Property Address': lead.propertyAddress,
      'Mailing Address': lead.mailingAddress,
      'HCAD Appraisal': lead.appraisal,
      'Property Owner': lead.owner,
      'Size': lead.size,
      'Parcel ID': lead.parcelId,
      'Date Added': lead.dateAdded,
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hcad-leads.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewLead = useCallback((lead: PropertyInfo) => {
    setViewModalLead(lead);
  }, []);

  const handleExportSingle = useCallback((lead: PropertyInfo) => {
    const csv = Papa.unparse([{
      'Property Address': lead.propertyAddress,
      'Mailing Address': lead.mailingAddress,
      'HCAD Appraisal': lead.appraisal,
      'Property Owner': lead.owner,
      'Size': lead.size,
      'Parcel ID': lead.parcelId,
      'Date Added': lead.dateAdded,
    }]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hcad-lead-${lead.parcelId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleDeleteLead = useCallback((lead: PropertyInfo) => {
    setDeleteConfirmLead(lead);
  }, []);

  const confirmDelete = () => {
    if (deleteConfirmLead) {
      setLeads(leads.filter(lead => lead.id !== deleteConfirmLead.id));
      setDeleteConfirmLead(null);
    }
  };

  // Bulk actions functions
  const handleSelectAll = useCallback(() => {
    if (selectedLeads.length === sortedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(sortedLeads.map(lead => lead.id));
    }
  }, [selectedLeads.length, sortedLeads]);

  const handleSelectLead = useCallback((leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  }, []);

  const handleBulkExport = useCallback(() => {
    const selectedLeadsData = sortedLeads.filter(lead => selectedLeads.includes(lead.id));
    const csv = Papa.unparse(selectedLeadsData.map(lead => ({
      'Property Address': lead.propertyAddress,
      'Mailing Address': lead.mailingAddress,
      'HCAD Appraisal': lead.appraisal,
      'Property Owner': lead.owner,
      'Size': lead.size,
      'Parcel ID': lead.parcelId,
      'Date Added': lead.dateAdded,
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hcad-leads-selected-${selectedLeads.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSelectedLeads([]);
  }, [sortedLeads, selectedLeads]);

  const handleBulkDelete = useCallback(() => {
    setLeads(leads.filter(lead => !selectedLeads.includes(lead.id)));
    setSelectedLeads([]);
  }, [leads, selectedLeads]);

  const handleClearSelection = useCallback(() => {
    setSelectedLeads([]);
  }, []);

  const handleMobileRowAction = useCallback((action: string, item: { id: string; [key: string]: unknown }) => {
    const propertyItem = item as PropertyInfo;
    switch (action) {
      case 'view':
        handleViewLead(propertyItem);
        break;
      case 'export':
        handleExportSingle(propertyItem);
        break;
      case 'delete':
        handleDeleteLead(propertyItem);
        break;
    }
  }, [handleViewLead, handleExportSingle, handleDeleteLead]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000); // Clear after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const CopyableField: React.FC<{ 
    value: string; 
    fieldName: string; 
    className?: string;
  }> = React.memo(({ value, fieldName, className = "" }) => {
    const isCopied = copiedField === fieldName;
    
    return (
      <div className="group relative inline-flex items-center">
        <span className={className}>{value}</span>
        <button
          onClick={() => copyToClipboard(value, fieldName)}
          className="ml-1 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 p-2 md:p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
          title={`Copy ${fieldName}`}
        >
          {isCopied ? (
            <svg className="w-4 h-4 md:w-3 md:h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 md:w-3 md:h-3 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    );
  });
  
  CopyableField.displayName = 'CopyableField';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={onBackToLanding}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-gray-900">Leads Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your HCAD property leads</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExportAll}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export All
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${leads.reduce((sum, lead) => sum + parseInt(lead.appraisal.replace(/[$,]/g, '')), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Appraisal</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${Math.round(leads.reduce((sum, lead) => sum + parseInt(lead.appraisal.replace(/[$,]/g, '')), 0) / leads.length).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leads.filter(lead => {
                    const date = new Date(lead.dateAdded);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return date > weekAgo;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by address, owner, or parcel ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as 'all' | 'recent' | 'high-value')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Leads</option>
                <option value="recent">Recent (Last 7 days)</option>
                <option value="high-value">High Value ($200k+)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'appraisal' | 'address')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Date Added</option>
                <option value="appraisal">Appraisal Value</option>
                <option value="address">Property Address</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedLeads.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleClearSelection}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkExport}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Property Leads ({sortedLeads.length})</h3>
              <div className="flex items-center text-gray-500 text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Hover any cell to copy</span>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-6">
              <SkeletonLoader variant="table" lines={5} />
            </div>
          ) : sortedLeads.length === 0 ? (
            <EmptyState
              variant={debouncedSearchTerm ? "search" : "leads"}
              title={debouncedSearchTerm ? "No results found" : "No leads yet"}
              description={debouncedSearchTerm ? "Try adjusting your search terms or filters." : "Upload your first HCAD screenshot to start building your leads database."}
              onAction={debouncedSearchTerm ? () => setSearchTerm('') : undefined}
              actionLabel={debouncedSearchTerm ? "Clear Search" : undefined}
            />
                      ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedLeads.length === sortedLeads.length && sortedLeads.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2">Select</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appraisal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parcel ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Added
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedLeads.map((lead) => (
                    <tr key={lead.id} className={`hover:bg-gray-50 ${selectedLeads.includes(lead.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="mb-1">
                            <CopyableField 
                              value={lead.propertyAddress} 
                              fieldName={`Property Address ${lead.id}`}
                              className="text-sm font-medium text-gray-900"
                            />
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-400 mr-1">Mail:</span>
                            <CopyableField 
                              value={lead.mailingAddress} 
                              fieldName={`Mailing Address ${lead.id}`}
                              className="text-sm text-gray-500"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CopyableField 
                          value={lead.owner} 
                          fieldName={`Owner ${lead.id}`}
                          className="text-sm text-gray-900"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CopyableField 
                          value={lead.appraisal} 
                          fieldName={`Appraisal ${lead.id}`}
                          className="text-sm font-semibold text-green-600"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CopyableField 
                          value={lead.size} 
                          fieldName={`Size ${lead.id}`}
                          className="text-sm text-gray-900"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CopyableField 
                          value={lead.parcelId} 
                          fieldName={`Parcel ID ${lead.id}`}
                          className="text-sm font-mono text-gray-900"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(lead.dateAdded).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleViewLead(lead)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleExportSingle(lead)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Export
                        </button>
                        <button 
                          onClick={() => handleDeleteLead(lead)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Table */}
            <div className="md:hidden">
              <MobileTable
                data={sortedLeads}
                columns={[
                  {
                    key: 'propertyAddress',
                    label: 'Property',
                    render: (value, item) => (
                      <div>
                        <div className="font-medium text-gray-900">{String(value)}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          <span className="text-xs text-gray-400 mr-1">Mail:</span>
                          {String((item as PropertyInfo).mailingAddress)}
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'owner',
                    label: 'Owner',
                    className: 'text-gray-900'
                  },
                  {
                    key: 'appraisal',
                    label: 'Appraisal',
                    className: 'font-semibold text-green-600'
                  },
                  {
                    key: 'size',
                    label: 'Size',
                    className: 'text-gray-900'
                  },
                  {
                    key: 'parcelId',
                    label: 'Parcel ID',
                    className: 'font-mono text-gray-900'
                  },
                  {
                    key: 'dateAdded',
                    label: 'Date Added',
                    render: (value) => new Date(String(value)).toLocaleDateString()
                  }
                ]}
                onRowAction={handleMobileRowAction}
                selectedItems={selectedLeads}
                onSelectItem={handleSelectLead}
                onSelectAll={handleSelectAll}
              />
            </div>
          </>
          )}
        </div>
      </main>

      {/* View Modal */}
      <MobileModal
        isOpen={!!viewModalLead}
        onClose={() => setViewModalLead(null)}
        title="Property Details"
        actions={
          viewModalLead && (
            <>
              <button
                onClick={() => setViewModalLead(null)}
                className="w-full md:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 touch-manipulation"
              >
                Close
              </button>
              <button
                onClick={() => handleExportSingle(viewModalLead)}
                className="w-full md:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 touch-manipulation"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
            </>
          )
        }
      >
        {viewModalLead && (
          <div className="space-y-6">
            {/* Property Address */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Property Address</h4>
              <p className="text-lg font-medium text-gray-900">{viewModalLead.propertyAddress}</p>
            </div>

            {/* Mailing Address */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-800 mb-2">Mailing Address</h4>
              <p className="text-lg font-medium text-gray-900">{viewModalLead.mailingAddress}</p>
            </div>

            {/* Property Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Property Owner</h4>
                <p className="text-lg text-gray-900">{viewModalLead.owner}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">HCAD Appraisal</h4>
                <p className="text-lg font-semibold text-green-600">{viewModalLead.appraisal}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Property Size</h4>
                <p className="text-lg text-gray-900">{viewModalLead.size}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Parcel ID</h4>
                <p className="text-lg font-mono text-gray-900">{viewModalLead.parcelId}</p>
              </div>
            </div>

            {/* Date Added */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-purple-800 mb-2">Date Added</h4>
              <p className="text-lg font-medium text-gray-900">
                {new Date(viewModalLead.dateAdded).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}
      </MobileModal>

      {/* Delete Confirmation Modal */}
      <MobileModal
        isOpen={!!deleteConfirmLead}
        onClose={() => setDeleteConfirmLead(null)}
        title="Delete Lead"
        className="md:max-w-md"
        actions={
          deleteConfirmLead && (
            <>
              <button
                onClick={() => setDeleteConfirmLead(null)}
                className="w-full md:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="w-full md:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 touch-manipulation"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </>
          )
        }
      >
        {deleteConfirmLead && (
          <div>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-3">
                Are you sure you want to delete this lead? This action cannot be undone.
              </p>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{deleteConfirmLead.propertyAddress}</p>
                <p className="text-sm text-gray-500">{deleteConfirmLead.owner}</p>
              </div>
            </div>
          </div>
        )}
      </MobileModal>
    </div>
  );
};

export default LeadsDashboard; 