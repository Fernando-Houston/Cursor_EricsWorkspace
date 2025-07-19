'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Icons imported but not used in this version

interface AnalyticsData {
  summary: Array<{ date: string; change_type: string; count: number }>;
  owner_changes: Array<{ property_address: string; previous_owner: string; new_owner: string; change_date: string; total_value?: number }>;
  value_changes: Array<{ property_address: string; owner_name: string; old_value: number; new_value: number; pct_change: number }>;
  market_activity: Array<{ zip: string; transactions: number; reappraisals: number; avg_new_value: number }>;
  stats: {
    total_properties: number;
    properties_with_values: number;
    total_portfolio_value: number;
    last_import: string;
  };
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/changes?days=${timeRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">HCAD Analytics Dashboard</h1>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data?.stats.total_properties.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">With Values</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data?.stats.properties_with_values.toLocaleString()}</p>
              <p className="text-xs text-gray-500">
                {((data?.stats.properties_with_values || 0) / (data?.stats.total_properties || 1) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${((data?.stats.total_portfolio_value || 0) / 1e9).toFixed(1)}B
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Last Update</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {data?.stats.last_import ? new Date(data.stats.last_import).toLocaleDateString() : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Time Range Selector */}
        <div className="mb-4 flex gap-2">
          {[7, 30, 90, 365].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded ${
                timeRange === days 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="changes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="changes">Recent Changes</TabsTrigger>
            <TabsTrigger value="owners">Owner Activity</TabsTrigger>
            <TabsTrigger value="values">Value Changes</TabsTrigger>
            <TabsTrigger value="markets">Market Analysis</TabsTrigger>
          </TabsList>

          {/* Recent Changes Tab */}
          <TabsContent value="changes">
            <Card>
              <CardHeader>
                <CardTitle>Property Changes Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.summary?.map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>
                      <span className="text-sm text-gray-600">{day.change_type}</span>
                      <span className="font-bold">{day.count} changes</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Owner Changes Tab */}
          <TabsContent value="owners">
            <Card>
              <CardHeader>
                <CardTitle>Recent Owner Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Property</th>
                        <th className="text-left p-2">Previous Owner</th>
                        <th className="text-left p-2">New Owner</th>
                        <th className="text-left p-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.owner_changes?.map((change, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2">{change.property_address}</td>
                          <td className="p-2">{change.previous_owner}</td>
                          <td className="p-2 font-medium">{change.new_owner}</td>
                          <td className="p-2">{new Date(change.change_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Value Changes Tab */}
          <TabsContent value="values">
            <Card>
              <CardHeader>
                <CardTitle>Significant Value Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Property</th>
                        <th className="text-left p-2">Owner</th>
                        <th className="text-right p-2">Old Value</th>
                        <th className="text-right p-2">New Value</th>
                        <th className="text-right p-2">Change %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.value_changes?.map((change, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2">{change.property_address}</td>
                          <td className="p-2">{change.owner_name}</td>
                          <td className="p-2 text-right">${change.old_value?.toLocaleString()}</td>
                          <td className="p-2 text-right font-medium">${change.new_value?.toLocaleString()}</td>
                          <td className={`p-2 text-right font-bold ${
                            change.pct_change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {change.pct_change > 0 ? '+' : ''}{change.pct_change}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Analysis Tab */}
          <TabsContent value="markets">
            <Card>
              <CardHeader>
                <CardTitle>Market Activity by ZIP Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data?.market_activity?.map((market, idx) => (
                    <div key={idx} className="p-4 border rounded">
                      <h3 className="font-bold text-lg mb-2">ZIP: {market.zip}</h3>
                      <div className="space-y-1 text-sm">
                        <p>Transactions: <span className="font-medium">{market.transactions}</span></p>
                        <p>Reappraisals: <span className="font-medium">{market.reappraisals}</span></p>
                        <p>Avg New Value: <span className="font-medium">
                          ${market.avg_new_value?.toLocaleString()}
                        </span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}