import React, { useState } from 'react';
import Papa from 'papaparse';

interface PropertyInfo {
  propertyAddress: string;
  mailingAddress: string;
  appraisal: string;
  owner?: string;
  ownerName?: string;
  size: string;
  parcelId: string;
  // Enhanced fields from AI extraction
  landValue?: number;
  improvementValue?: number;
  totalValue?: number;
  propertyType?: string;
  yearBuilt?: number;
  squareFootage?: number;
  lotSize?: string;
  acreage?: number;
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  exteriorWall?: string;
  roofType?: string;
  foundation?: string;
  heating?: string;
  cooling?: string;
  fireplace?: boolean;
  pool?: boolean;
  garage?: string;
  legalDescription?: string;
  exemptions?: string;
  taxYear?: string;
  neighborhood?: string;
  confidence?: number;
  enhancedConfidence?: number;
  processedAt?: string;
  processingStages?: string[];
  // Enhanced historical data
  recentAppraisals?: Array<{
    year: string;
    landValue: number;
    improvementValue: number;
    totalValue: number;
  }>;
  taxHistory?: Array<{
    year: string;
    taxAmount: number;
    taxRate: number;
    exemptions: string;
  }>;
  salesHistory?: Array<{
    date: string;
    price: number;
    documentType: string;
  }>;
  propertyDetails?: {
    subdivision?: string;
    schoolDistrict?: string;
    municipalUtilityDistrict?: string;
    floodZone?: string;
    deed?: string;
  };
}

interface PropertyTableProps {
  info: PropertyInfo;
}

const PropertyTable: React.FC<PropertyTableProps> = ({ info }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'history' | 'export'>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleExportCSV = () => {
    const csv = Papa.unparse([
      {
        'Property Address': info.propertyAddress,
        'Mailing Address': info.mailingAddress,
        'HCAD Appraisal': info.appraisal,
        'Property Owner': info.owner,
        'Size': info.size,
        'Parcel ID': info.parcelId,
      },
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'property-info.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const jsonString = JSON.stringify(info, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'property-info.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



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
    value: string | number; 
    fieldName: string; 
    className?: string;
    prefix?: string;
  }> = ({ value, fieldName, className = "", prefix = "" }) => {
    const displayValue = `${prefix}${value}`;
    const isCopied = copiedField === fieldName;
    
    return (
      <div className="group relative inline-flex items-center">
        <span className={className}>{displayValue}</span>
        <button
          onClick={() => copyToClipboard(displayValue, fieldName)}
          className="ml-2 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 p-2 md:p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
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
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
        <h2 className="text-2xl font-bold mb-2">Property Information Dashboard</h2>
        <div className="flex items-center justify-between">
          <p className="text-blue-100">Extracted from HCAD Screenshot</p>
          <div className="flex items-center text-blue-100 text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Hover to copy any field</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Detailed View
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            History & Analytics
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Export Data
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">Appraisal Value</p>
                    <CopyableField 
                      value={info.appraisal} 
                      fieldName="Appraisal Value"
                      className="text-2xl font-bold text-green-900"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">Property Size</p>
                    <CopyableField 
                      value={info.size} 
                      fieldName="Property Size"
                      className="text-2xl font-bold text-blue-900"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-600">Parcel ID</p>
                    <CopyableField 
                      value={info.parcelId} 
                      fieldName="Parcel ID"
                      className="text-lg font-bold text-purple-900 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Property Address</label>
                  <div className="mt-1">
                    <CopyableField 
                      value={info.propertyAddress} 
                      fieldName="Property Address"
                      className="text-lg text-gray-900 font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mailing Address</label>
                  <div className="mt-1">
                    <CopyableField 
                      value={info.mailingAddress} 
                      fieldName="Mailing Address"
                      className="text-lg text-gray-900 font-medium"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Property Owner</label>
                  <div className="mt-1">
                    <CopyableField 
                      value={info.owner || info.ownerName || 'N/A'} 
                      fieldName="Property Owner"
                      className="text-lg text-gray-900 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Complete Property Information</h3>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Property Address:</span>
                  <CopyableField 
                    value={info.propertyAddress} 
                    fieldName="Property Address (Details)"
                    className="text-sm text-gray-900"
                  />
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Mailing Address:</span>
                  <CopyableField 
                    value={info.mailingAddress} 
                    fieldName="Mailing Address (Details)"
                    className="text-sm text-gray-900"
                  />
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">HCAD Appraisal:</span>
                  <CopyableField 
                    value={info.appraisal} 
                    fieldName="HCAD Appraisal (Details)"
                    className="text-sm font-semibold text-green-600"
                  />
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Property Owner:</span>
                  <CopyableField 
                    value={info.owner || info.ownerName || 'N/A'} 
                    fieldName="Property Owner (Details)"
                    className="text-sm text-gray-900"
                  />
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Size:</span>
                  <CopyableField 
                    value={info.size} 
                    fieldName="Property Size (Details)"
                    className="text-sm text-gray-900"
                  />
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Parcel ID:</span>
                  <CopyableField 
                    value={info.parcelId} 
                    fieldName="Parcel ID (Details)"
                    className="text-sm font-mono text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Data Quality Indicators */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Data Extraction Complete</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>All property information has been successfully extracted from your screenshot. The data is ready for export or further processing.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Processing Information */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4">AI Processing Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-indigo-100">
                  <div className="flex items-center">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-indigo-600">Vision Confidence</p>
                      <p className="text-lg font-bold text-indigo-900">{info.confidence || 'N/A'}%</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-indigo-100">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Enhanced Data</p>
                      <p className="text-lg font-bold text-green-900">{info.enhancedConfidence || 'N/A'}%</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-indigo-100">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Processed At</p>
                      <p className="text-sm font-bold text-blue-900">
                        {info.processedAt ? new Date(info.processedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {info.processingStages && (
                <div className="mt-4">
                  <p className="text-sm text-indigo-700">
                    Processing stages: {info.processingStages.join(' → ')}
                  </p>
                </div>
              )}
            </div>

            {/* Historical Appraisals */}
            {info.recentAppraisals && info.recentAppraisals.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Appraisal History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Land Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Improvement Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {info.recentAppraisals.map((appraisal, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appraisal.year}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${appraisal.landValue.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${appraisal.improvementValue.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">${appraisal.totalValue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tax History */}
            {info.taxHistory && info.taxHistory.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Tax Payment History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exemptions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {info.taxHistory.map((tax, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tax.year}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${tax.taxAmount.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tax.taxRate}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tax.exemptions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sales History */}
            {info.salesHistory && info.salesHistory.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Sales & Transfer History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {info.salesHistory.map((sale, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">${sale.price.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.documentType}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Property Details */}
            {info.propertyDetails && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Additional Property Details</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {info.propertyDetails.subdivision && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Subdivision</label>
                        <p className="mt-1 text-sm text-gray-900">{info.propertyDetails.subdivision}</p>
                      </div>
                    )}
                    {info.propertyDetails.schoolDistrict && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">School District</label>
                        <p className="mt-1 text-sm text-gray-900">{info.propertyDetails.schoolDistrict}</p>
                      </div>
                    )}
                    {info.propertyDetails.municipalUtilityDistrict && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Municipal Utility District</label>
                        <p className="mt-1 text-sm text-gray-900">{info.propertyDetails.municipalUtilityDistrict}</p>
                      </div>
                    )}
                    {info.propertyDetails.floodZone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Flood Zone</label>
                        <p className="mt-1 text-sm text-gray-900">{info.propertyDetails.floodZone}</p>
                      </div>
                    )}
                    {info.propertyDetails.deed && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Deed Information</label>
                        <p className="mt-1 text-sm text-gray-900">{info.propertyDetails.deed}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* No Enhanced Data Message */}
            {(!info.recentAppraisals || info.recentAppraisals.length === 0) && 
             (!info.taxHistory || info.taxHistory.length === 0) && 
             (!info.salesHistory || info.salesHistory.length === 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Enhanced Data Not Available</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Historical property data (appraisals, tax history, sales) is not available yet. This feature requires Perplexity API access to search HCAD records.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
              <p className="text-gray-600 mb-6">Choose your preferred format to download the property information.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as CSV
                </button>
                
                <button
                  onClick={handleExportJSON}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as JSON
                </button>
              </div>
            </div>

            {/* Export Preview */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
              </div>
              <div className="p-6">
                <pre className="bg-gray-50 p-4 rounded-lg text-sm text-gray-800 overflow-x-auto">
                  {JSON.stringify(info, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyTable; 