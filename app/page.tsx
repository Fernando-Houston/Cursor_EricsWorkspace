"use client";
import React, { useState, useRef } from 'react';
import UploadForm, { UploadFormRef } from './components/UploadForm';
import PropertyTable from './components/PropertyTable';
import LeadsDashboard from './components/LeadsDashboard';

interface PropertyInfo {
  propertyAddress: string;
  mailingAddress: string;
  appraisal: string;
  owner: string;
  size: string;
  parcelId: string;
}

export default function Home() {
  const [currentView, setCurrentView] = useState<'landing' | 'results' | 'dashboard'>('landing');
  const [propertyInfo, setPropertyInfo] = useState<PropertyInfo | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ loading: boolean; hasFile: boolean; error: string | null; processingStage: string }>({ loading: false, hasFile: false, error: null, processingStage: 'idle' });
  const uploadFormRef = useRef<UploadFormRef>(null);

  const handleUploadSuccess = (info: PropertyInfo) => {
    setPropertyInfo(info);
    setCurrentView('results');
  };

  const handleSubmitClick = () => {
    if (uploadFormRef.current) {
      uploadFormRef.current.submitForm();
    }
  };

  const handleGoToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setPropertyInfo(null);
  };

  if (currentView === 'results' && propertyInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <button
                  onClick={handleBackToLanding}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h1 className="text-2xl font-bold text-gray-900">Extraction Results</h1>
                  <p className="text-sm text-gray-500">Property data extracted successfully</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleGoToDashboard}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View All Leads
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Results Content */}
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <PropertyTable info={propertyInfo} />
        </main>
      </div>
    );
  }

  if (currentView === 'dashboard') {
    return <LeadsDashboard onBackToLanding={handleBackToLanding} />;
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-gray-900">HCAD Property Extractor</h1>
                <p className="text-sm text-gray-500">Extract property data from HCAD screenshots</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoToDashboard}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Leads
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Extract Property Data in Seconds
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload a screenshot of any HCAD property page and instantly extract all the important information into your leads database.
          </p>
        </div>

        {/* Phone Screen Upload Interface */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Phone Frame */}
            <div className="relative bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
              <div className="bg-white rounded-[2.5rem] w-80 h-[600px] overflow-hidden">
                {/* Phone Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 text-center">
                  <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold">HCAD Extractor</h3>
                  <p className="text-sm text-blue-100">Upload Screenshot</p>
                </div>

                {/* Phone Content */}
                <div className="p-6 h-full flex flex-col">
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="mb-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload HCAD Screenshot</h4>
                      <p className="text-sm text-gray-600 mb-6">
                        Take a screenshot of the property page and upload it here to extract all the data automatically.
                      </p>
                    </div>

                    {/* Upload Form */}
                    <div className="w-full">
                      <UploadForm 
                        ref={uploadFormRef}
                        onResult={handleUploadSuccess}
                        onStatusChange={setUploadStatus}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-green-400 rounded-full animate-pulse delay-1000"></div>
          </div>
        </div>

        {/* External Submit Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleSubmitClick}
            disabled={uploadStatus.loading || !uploadStatus.hasFile}
            className="flex justify-center items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {uploadStatus.loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {uploadStatus.processingStage === 'vision' ? 'Reading Screenshot...' : 
                 uploadStatus.processingStage === 'enhancement' ? 'Enhancing Data...' : 
                 uploadStatus.processingStage === 'complete' ? 'Complete!' : 'Processing...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Extract Property Data
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {uploadStatus.error && (
          <div className="flex justify-center mt-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{uploadStatus.error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600">Extract property data in under 30 seconds</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">100% Accurate</h3>
            <p className="text-gray-600">AI-powered extraction with human-level accuracy</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h3>
            <p className="text-gray-600">Your data stays private and secure</p>
          </div>
        </div>
      </main>
    </div>
  );
}