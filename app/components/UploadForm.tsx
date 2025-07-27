import React, { useState, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import LoadingProgress from './LoadingProgress';
import { useN8nWebhook } from '../hooks/useN8nWebhook';

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
  onStatusChange?: (status: { loading: boolean; hasFile: boolean; error: string | null; processingStage: string }) => void;
}

export interface UploadFormRef {
  submitForm: () => void;
}

const UploadForm = forwardRef<UploadFormRef, UploadFormProps>(({ onResult, onStatusChange }, ref) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<'idle' | 'vision' | 'enhancement' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);
  const [useN8n] = useState(false);
  
  const { analyzeProperty } = useN8nWebhook({
    onSuccess: (data) => {
      console.log('N8N webhook success:', data);
      // Refresh the property list or update UI
    },
    onError: (error) => {
      setError(error);
    }
  });

  // Update parent component with current status
  React.useEffect(() => {
    if (onStatusChange) {
      onStatusChange({
        loading,
        hasFile: !!file,
        error,
        processingStage
      });
    }
  }, [loading, file, error, processingStage, onStatusChange]);

  // Expose submit function through ref
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      if (file && !loading) {
        handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      }
    }
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file size before setting (20MB limit)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (selectedFile.size > maxSize) {
        const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
        setError(`File size (${fileSizeMB}MB) exceeds 20MB limit. Please use a smaller image.`);
        return;
      }
      
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
    setProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Submitting file:', file.name, file.size, 'bytes');
    
    try {
      // Simulate realistic progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (processingStage === 'vision' && prev < 40) {
            return prev + Math.random() * 5;
          } else if (processingStage === 'enhancement' && prev < 80) {
            return prev + Math.random() * 3;
          } else if (processingStage === 'complete' && prev < 100) {
            return 100;
          }
          return prev;
        });
      }, 200);

      // Stage progression
      setTimeout(() => {
        setProcessingStage('enhancement');
        setProgress(45);
      }, 2000);
      
      let res;
      
      if (useN8n && process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL) {
        // Convert file to base64 for n8n webhook
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        // Call n8n webhook instead
        await analyzeProperty({ screenshot: base64 });
        
        // Fetch the latest data from our database
        res = await fetch('/api/properties');
      } else {
        // Use existing property-info endpoint
        res = await fetch('/api/property-info', {
          method: 'POST',
          body: formData,
        });
      }
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        clearInterval(progressInterval);
        let errorMessage = 'Failed to process image.';
        
        // Handle specific error codes
        if (res.status === 413) {
          errorMessage = 'File size too large. Please use an image under 20MB.';
        } else {
          try {
            const err = await res.json();
            console.error('API error:', err);
            errorMessage = err.error || errorMessage;
          } catch (jsonError) {
            // If response is not JSON, use status text
            errorMessage = `Server error: ${res.statusText || res.status}`;
          }
        }
        
        setError(errorMessage);
        setLoading(false);
        setProcessingStage('idle');
        setProgress(0);
        return;
      }
      const data = await res.json();
      console.log('API response:', data);
      
      clearInterval(progressInterval);
      setProcessingStage('complete');
      setProgress(100);
      onResult(data);
      setLoading(false);
      
      // Reset stage after a moment
      setTimeout(() => {
        setProcessingStage('idle');
        setProgress(0);
      }, 1500);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('An error occurred.');
      setLoading(false);
      setProcessingStage('idle');
      setProgress(0);
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
              <div className="relative w-full max-h-48 rounded-lg border border-gray-200 overflow-hidden">
                <Image
                  src={preview || ''}
                  alt="Screenshot preview"
                  width={400}
                  height={192}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
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

      {/* Enhanced Loading Progress */}
      {loading && (
        <LoadingProgress
          currentStage={processingStage}
          progress={progress}
          stages={[
            {
              id: 'vision',
              label: 'OpenAI Vision Analysis',
              description: 'Reading and extracting text from HCAD screenshot',
              duration: 3,
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            },
            {
              id: 'enhancement',
              label: 'Perplexity Enhancement',
              description: 'Enriching property data with additional information',
              duration: 4,
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            },
            {
              id: 'complete',
              label: 'Processing Complete',
              description: 'Data extraction and enhancement finished',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          ]}
        />
      )}

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
});

UploadForm.displayName = 'UploadForm';

export default UploadForm; 