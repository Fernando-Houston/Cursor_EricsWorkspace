'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle, Target, Brain, MapPin } from 'lucide-react';

interface MarketInsights {
  hotZones: Array<{
    zip: string;
    growth_rate: number;
    avg_value: number;
    transaction_volume: number;
    investor_percentage: number;
  }>;
  investmentOpportunities: Array<{
    account_number: string;
    property_address: string;
    estimated_value: number;
    market_value: number;
    discount_percentage: number;
    confidence: number;
  }>;
  portfolioAnalysis: Array<{
    owner_name: string;
    total_properties: number;
    portfolio_value: number;
    recent_acquisitions: number;
    avg_property_value: number;
    growth_trend: string;
  }>;
  predictions: {
    total: number;
    highConfidence: number;
    avgConfidence: number;
  };
}

export default function MarketInsights() {
  const [insights, setInsights] = useState<MarketInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/analytics/insights-static');
      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const runPredictions = async () => {
    setPredicting(true);
    try {
      const response = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5000 })
      });
      const result = await response.json();
      alert(`Successfully predicted values for ${result.predictions} properties!`);
      fetchInsights(); // Refresh data
    } catch (error) {
      console.error('Prediction failed:', error);
      alert('Failed to run predictions');
    } finally {
      setPredicting(false);
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Market Intelligence & AI Insights</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Advanced analytics powered by machine learning
            </p>
          </div>
          <button
            onClick={runPredictions}
            disabled={predicting}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Brain className="h-5 w-5" />
            {predicting ? 'Running Predictions...' : 'Run ML Predictions'}
          </button>
        </div>

        {/* AI Predictions Summary */}
        <Card className="mb-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6" />
              AI Value Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-3xl font-bold">{insights?.predictions.total.toLocaleString() || 0}</p>
                <p className="text-purple-100">Total Predictions</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{insights?.predictions.highConfidence.toLocaleString() || 0}</p>
                <p className="text-purple-100">High Confidence (&gt;70%)</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{insights?.predictions.avgConfidence.toFixed(1) || 0}%</p>
                <p className="text-purple-100">Average Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Hot Zones */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              Hot Market Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights?.hotZones.map((zone, idx) => (
                <div key={idx} className="p-4 border rounded-lg hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{zone.zip}</h3>
                    <div className={`flex items-center gap-1 ${
                      zone.growth_rate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {zone.growth_rate > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="font-medium">{zone.growth_rate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>Avg Value: <span className="font-medium">${(zone.avg_value / 1000).toFixed(0)}k</span></p>
                    <p>Transactions: <span className="font-medium">{zone.transaction_volume}</span></p>
                    <p>Investor Activity: <span className="font-medium">{zone.investor_percentage.toFixed(1)}%</span></p>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                        style={{ width: `${Math.min(zone.investor_percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Investor Saturation</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Investment Opportunities */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              AI-Identified Investment Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Property</th>
                    <th className="text-right p-2">Market Value</th>
                    <th className="text-right p-2">AI Estimate</th>
                    <th className="text-right p-2">Opportunity</th>
                    <th className="text-right p-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {insights?.investmentOpportunities.map((opp, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{opp.property_address}</p>
                          <p className="text-xs text-gray-500">{opp.account_number}</p>
                        </div>
                      </td>
                      <td className="p-2 text-right">${opp.market_value.toLocaleString()}</td>
                      <td className="p-2 text-right font-medium">${opp.estimated_value.toLocaleString()}</td>
                      <td className="p-2 text-right">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                          {opp.discount_percentage.toFixed(1)}% under
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${opp.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{opp.confidence}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Movers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Active Portfolio Managers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights?.portfolioAnalysis.map((portfolio, idx) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{portfolio.owner_name}</h3>
                      <p className="text-sm text-gray-600">
                        {portfolio.total_properties} properties • 
                        ${(portfolio.portfolio_value / 1e6).toFixed(1)}M portfolio
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Recent Activity</p>
                      <p className="font-bold text-lg">{portfolio.recent_acquisitions} new</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span>Avg Property: ${(portfolio.avg_property_value / 1000).toFixed(0)}k</span>
                    <span className={`flex items-center gap-1 ${
                      portfolio.growth_trend === 'increasing' ? 'text-green-600' : 
                      portfolio.growth_trend === 'decreasing' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {portfolio.growth_trend === 'increasing' ? <TrendingUp className="h-4 w-4" /> : 
                       portfolio.growth_trend === 'decreasing' ? <TrendingDown className="h-4 w-4" /> : 
                       '→'}
                      {portfolio.growth_trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}