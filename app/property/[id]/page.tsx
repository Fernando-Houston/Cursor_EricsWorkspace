'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, MapPin, DollarSign, User, TrendingUp, 
  Building, Ruler, AlertCircle,
  Brain, Map, Calculator
} from 'lucide-react';

interface PropertyDetails {
  // Basic Information
  account_number: string;
  property_address: string;
  legal_description?: string;
  
  // Ownership
  owner_name: string;
  mail_address: string;
  ownership_history?: Array<{
    owner: string;
    date: string;
    price?: number;
  }>;
  
  // Property Characteristics
  property_type: string;
  year_built?: number;
  area_acres: number;
  square_feet?: number;
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  construction_type?: string;
  foundation_type?: string;
  
  // Location
  zip: string;
  subdivision?: string;
  city?: string;
  school_district?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  
  // Valuation
  total_value: number;
  land_value?: number;
  improvement_value?: number;
  tax_amount?: number;
  exemptions?: string[];
  
  // Smart Features
  market_analysis?: {
    estimated_value: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
    growth_rate: number;
  };
  comparables?: Array<{
    address: string;
    distance: number;
    value: number;
    price_per_sqft: number;
  }>;
  investment_score?: number;
  rental_estimate?: number;
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPropertyDetails();
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPropertyDetails = async () => {
    try {
      // Try Railway API first for real data
      const response = await fetch(`/api/property/${params.id}/railway`);
      const data = await response.json();
      
      if (data.error && response.status === 404) {
        // Try the static API as fallback
        const fallbackResponse = await fetch(`/api/property/${params.id}`);
        const fallbackData = await fallbackResponse.json();
        setProperty(fallbackData);
      } else {
        setProperty(data);
      }
    } catch (error) {
      console.error('Failed to fetch property details:', error);
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

  if (!property) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
              <p className="text-gray-600 mb-4">Account #{params.id} could not be found.</p>
              <Link href="/analytics" className="text-blue-600 hover:underline">
                Back to Analytics
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const pricePerSqFt = property.square_feet && property.total_value ? property.total_value / property.square_feet : 0;
  const improvementRatio = property.land_value ? 
    ((property.improvement_value || 0) / property.total_value * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{property.property_address}</h1>
              <p className="text-gray-500 mt-1">Account #{property.account_number}</p>
            </div>
            <div className="flex gap-4">
              <Link 
                href="/analytics" 
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back to Search
              </Link>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save to Leads
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-2xl font-bold">${property.total_value ? property.total_value.toLocaleString() : 'N/A'}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Property Type</p>
                  <p className="text-2xl font-bold">{property.property_type}</p>
                </div>
                <Building className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Size</p>
                  <p className="text-2xl font-bold">{property.area_acres ? property.area_acres.toFixed(2) : '0'} acres</p>
                  {property.square_feet && (
                    <p className="text-xs text-gray-500">{property.square_feet.toLocaleString()} sqft</p>
                  )}
                </div>
                <Ruler className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Price/SqFt</p>
                  <p className="text-2xl font-bold">{pricePerSqFt ? `$${pricePerSqFt.toFixed(0)}` : 'N/A'}</p>
                  {property.market_analysis && (
                    <p className={`text-xs ${
                      property.market_analysis.trend === 'up' ? 'text-green-600' : 
                      property.market_analysis.trend === 'down' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {property.market_analysis.trend === 'up' ? '↑' : 
                       property.market_analysis.trend === 'down' ? '↓' : '→'} 
                      {property.market_analysis.growth_rate}% YoY
                    </p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-6">
            {['overview', 'valuation', 'history', 'analysis', 'comparables'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Property Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{property.property_address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ZIP Code</p>
                      <p className="font-medium">{property.zip}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Year Built</p>
                      <p className="font-medium">{property.year_built || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Property Type</p>
                      <p className="font-medium">{property.property_type}</p>
                    </div>
                    {property.bedrooms && (
                      <div>
                        <p className="text-sm text-gray-500">Bedrooms</p>
                        <p className="font-medium">{property.bedrooms}</p>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div>
                        <p className="text-sm text-gray-500">Bathrooms</p>
                        <p className="font-medium">{property.bathrooms}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Ownership Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Current Owner</p>
                      <p className="font-medium">{property.owner_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Mailing Address</p>
                      <p className="font-medium">{property.mail_address}</p>
                    </div>
                    {property.property_address !== property.mail_address && (
                      <Badge variant="secondary">Non-Owner Occupied</Badge>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'valuation' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Valuation Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Land Value</span>
                      <span className="font-medium">${(property.land_value || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Improvement Value</span>
                      <span className="font-medium">${(property.improvement_value || 0).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-4 flex justify-between items-center">
                      <span className="font-medium">Total Appraised Value</span>
                      <span className="text-xl font-bold">${property.total_value ? property.total_value.toLocaleString() : 'N/A'}</span>
                    </div>
                    <div className="pt-4">
                      <p className="text-sm text-gray-500 mb-2">Improvement Ratio</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${improvementRatio}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{improvementRatio}% of total value</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'analysis' && property.market_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Market Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Estimated Market Value</p>
                      <div className="flex items-end gap-4">
                        <p className="text-3xl font-bold">
                          ${property.market_analysis.estimated_value ? property.market_analysis.estimated_value.toLocaleString() : 'N/A'}
                        </p>
                        <p className={`text-sm ${
                          property.market_analysis.estimated_value > property.total_value 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {property.market_analysis.estimated_value > property.total_value ? '+' : ''}
                          {property.market_analysis.estimated_value && property.total_value ? 
                            ((property.market_analysis.estimated_value - property.total_value) / property.total_value * 100).toFixed(1) : '0'}%
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Confidence Score</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
                            style={{ width: `${property.market_analysis.confidence}%` }}
                          />
                        </div>
                        <span className="font-medium">{property.market_analysis.confidence}%</span>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-2">Investment Potential</p>
                      <p className="text-sm text-blue-700">
                        This property shows {property.market_analysis.trend === 'up' ? 'strong growth' : 
                        property.market_analysis.trend === 'down' ? 'declining value' : 'stable'} trends 
                        with {property.market_analysis.growth_rate}% annual appreciation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Smart Features */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Brain className="h-5 w-5" />
                  Smart Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.investment_score && (
                  <div>
                    <p className="text-sm text-purple-700">Investment Score</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-purple-900">{property.investment_score}/100</p>
                      <Badge className={
                        property.investment_score >= 80 ? 'bg-green-600' :
                        property.investment_score >= 60 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }>
                        {property.investment_score >= 80 ? 'Excellent' :
                         property.investment_score >= 60 ? 'Good' : 'Fair'}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {property.rental_estimate && (
                  <div>
                    <p className="text-sm text-purple-700">Estimated Monthly Rent</p>
                    <p className="text-2xl font-bold text-purple-900">
                      ${property.rental_estimate.toLocaleString()}
                    </p>
                    <p className="text-xs text-purple-600">
                      {property.rental_estimate && property.total_value ? 
                        ((property.rental_estimate * 12) / property.total_value * 100).toFixed(1) : '0'}% cap rate
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-12 w-12 text-gray-400" />
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <p><span className="text-gray-500">Neighborhood:</span> {property.neighborhood || 'N/A'}</p>
                  <p><span className="text-gray-500">School District:</span> {property.school_district || 'N/A'}</p>
                  <p><span className="text-gray-500">Subdivision:</span> {property.subdivision || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}