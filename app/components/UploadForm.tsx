import React, { useState } from 'react';

interface PropertyInfo {
  propertyAddress: string;
  mailingAddress: string;
  appraisal: string;
  owner: string;
  size: string;
  parcelId: string;
}

interface UploadFormProps {
  onResult: (info: PropertyInfo) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onResult }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<'idle' | 'vision' | 'enhancement' | 'complete'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file.');
      return;
    }
    setLoading(true);
    setError(null);
    setProcessingStage('vision');
    
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Submitting file:', file.name, file.size, 'bytes');
    
    try {
      // Simulate stage progression for better UX
      setTimeout(() => {
        if (processingStage === 'vision') {
          setProcessingStage('enhancement');
        }
      }, 2000);
      
      const res = await fetch('/api/property-info', {
        method: 'POST',
        body: formData,
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const err = await res.json();
        console.error('API error:', err);
        setError(err.error || 'Failed to process image.');
        setLoading(false);
        setProcessingStage('idle');
        return;
      }
      const data = await res.json();
      console.log('API response:', data);
      setProcessingStage('complete');
      onResult(data);
      setLoading(false);
      
      // Reset stage after a moment
      setTimeout(() => {
        setProcessingStage('idle');
      }, 1000);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('An error occurred.');
      setLoading(false);
      setProcessingStage('idle');
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File Upload Area */}
      <div className="space-y-3">
        {!preview ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
            <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-2">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-sm font-medium text-gray-900">Choose a file</span>
                <span className="block text-xs text-gray-500">PNG, JPG, JPEG</span>
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                className="sr-only"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Image Preview */}
            <div className="relative">
              <img
                src={preview}
                alt="Screenshot preview"
                className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* File Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-900 truncate">{file?.name}</span>
                </div>
                <span className="text-xs text-gray-500">{file ? (file.size / 1024 / 1024).toFixed(2) : '0'} MB</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Processing Stages Indicator */}
      {loading && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-blue-900">AI Processing Pipeline</h3>
            <div className="flex items-center">
              <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          
          <div className="space-y-2">
            {/* Stage 1: Vision */}
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                processingStage === 'vision' ? 'bg-blue-500 animate-pulse' : 
                processingStage === 'enhancement' || processingStage === 'complete' ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {(processingStage === 'enhancement' || processingStage === 'complete') && (
                  <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${
                processingStage === 'vision' ? 'text-blue-700 font-medium' : 
                processingStage === 'enhancement' || processingStage === 'complete' ? 'text-green-700' : 'text-gray-600'
              }`}>
                OpenAI Vision - Reading HCAD screenshot
              </span>
            </div>
            
            {/* Stage 2: Enhancement */}
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                processingStage === 'enhancement' ? 'bg-purple-500 animate-pulse' : 
                processingStage === 'complete' ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {processingStage === 'complete' && (
                  <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${
                processingStage === 'enhancement' ? 'text-purple-700 font-medium' : 
                processingStage === 'complete' ? 'text-green-700' : 'text-gray-600'
              }`}>
                Perplexity Search - Enhancing with HCAD data
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !file}
        className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {processingStage === 'vision' ? 'Reading Screenshot...' : 
             processingStage === 'enhancement' ? 'Enhancing Data...' : 
             processingStage === 'complete' ? 'Complete!' : 'Processing...'}
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Extract Property Data
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default UploadForm; 