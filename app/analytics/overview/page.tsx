'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Building2, Users, DollarSign, TrendingUp, Search, Home } from 'lucide-react';

interface AnalyticsData {
  stats: {
    total_properties: number;
    properties_with_values: number;
    total_portfolio_value: number;
    avg_property_value: number;
    unique_owners: number;
    non_owner_occupied: number;
  };
  top_owners: Array<{
    owner_name: string;
    property_count: number;
    portfolio_value: number;
    total_acres: number;
  }>;
  property_types: Array<{
    property_type: string;
    count: number;
    avg_value: number;
    total_value: number;
  }>;
  zip_analysis: Array<{
    zip: string;
    property_count: number;
    avg_value: number;
    investor_owned: number;
    total_acres: number;
  }>;
  value_distribution: Array<{
    value_range: string;
    count: number;
  }>;
}

export default function AnalyticsOverview() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchType, setSearchType] = useState('owner');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/overview');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch('/api/analytics/overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchType, searchValue })
      });
      const result = await response.json();
      setSearchResults(result.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const investorPercentage = ((data?.stats.non_owner_occupied || 0) / (data?.stats.total_properties || 1) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">HCAD Property Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive analysis of {data?.stats.total_properties.toLocaleString()} Harris County properties
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href="/analytics/insights"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Insights
            </a>
            <a
              href="/"
              className="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Back to Home
            </a>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Total Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{data?.stats.total_properties.toLocaleString()}</p>
              <p className="text-sm opacity-90">
                {data?.stats.properties_with_values.toLocaleString()} with values
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${(data?.stats.total_portfolio_value / 1e9).toFixed(1)}B
              </p>
              <p className="text-sm opacity-90">
                Avg: ${(data?.stats.avg_property_value / 1e3).toFixed(0)}k
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Unique Owners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{data?.stats.unique_owners.toLocaleString()}</p>
              <p className="text-sm opacity-90">
                Avg {((data?.stats.total_properties || 0) / (data?.stats.unique_owners || 1)).toFixed(1)} properties each
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Investor Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{investorPercentage}%</p>
              <p className="text-sm opacity-90">
                {data?.stats.non_owner_occupied.toLocaleString()} non-owner occupied
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Property Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <select 
                className="px-4 py-2 border rounded"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="owner">By Owner Name</option>
                <option value="address">By Address</option>
                <option value="zip">By ZIP Code</option>
                <option value="high-value">High Value (&gt;$1M)</option>
              </select>
              <Input
                type="text"
                placeholder={searchType === 'high-value' ? 'Minimum value' : 'Search...'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="text-left p-2">Property</th>
                      <th className="text-left p-2">Owner</th>
                      <th className="text-right p-2">Value</th>
                      <th className="text-right p-2">Acres</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((result, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{result.property_address}</p>
                            {result.property_address !== result.mail_address && (
                              <p className="text-xs text-gray-500">Mail: {result.mail_address}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-2">{result.owner_name}</td>
                        <td className="p-2 text-right">
                          {result.total_value ? `$${result.total_value.toLocaleString()}` : 'N/A'}
                        </td>
                        <td className="p-2 text-right">{result.area_acres || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Property Owners */}
          <Card>
            <CardHeader>
              <CardTitle>Top Property Owners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.top_owners.slice(0, 10).map((owner, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex-1">
                      <p className="font-medium truncate">{owner.owner_name}</p>
                      <p className="text-sm text-gray-600">
                        {owner.property_count} properties • {owner.total_acres?.toFixed(1)} acres
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        ${(owner.portfolio_value / 1e6).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Property Value Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Value Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.value_distribution.map((range, idx) => {
                  const percentage = (range.count / (data?.stats.properties_with_values || 1) * 100);
                  return (
                    <div key={idx}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{range.value_range}</span>
                        <span className="text-sm">{range.count.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Property Types */}
          <Card>
            <CardHeader>
              <CardTitle>Property Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.property_types.map((type, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <p className="font-medium">{type.property_type}</p>
                      <p className="text-sm text-gray-600">{type.count.toLocaleString()} properties</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${(type.avg_value / 1e3).toFixed(0)}k</p>
                      <p className="text-xs text-gray-600">avg value</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top ZIP Codes */}
          <Card>
            <CardHeader>
              <CardTitle>Top ZIP Codes by Property Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.zip_analysis.slice(0, 10).map((zip, idx) => {
                  const investorRate = (zip.investor_owned / zip.property_count * 100).toFixed(1);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <p className="font-bold text-lg">{zip.zip}</p>
                        <p className="text-sm text-gray-600">
                          {zip.property_count.toLocaleString()} properties • {investorRate}% investor owned
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(zip.avg_value / 1e3).toFixed(0)}k</p>
                        <p className="text-xs text-gray-600">avg value</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}