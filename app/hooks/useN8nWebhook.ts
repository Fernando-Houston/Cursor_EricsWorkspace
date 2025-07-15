import { useState } from 'react';

interface N8nWebhookOptions {
  webhookUrl?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useN8nWebhook(options: N8nWebhookOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeProperty = async (data: {
    screenshot?: string;
    accountNumber?: string;
    [key: string]: any;
  }) => {
    setIsProcessing(true);
    setError(null);

    try {
      const webhookUrl = options.webhookUrl || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
      
      if (!webhookUrl) {
        throw new Error('N8N webhook URL not configured');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process property data');
      }

      if (result.success) {
        console.log('Property data extracted:', result.data);
        options.onSuccess?.(result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process property data';
      console.error('N8N webhook error:', errorMessage);
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const captureAndAnalyze = async () => {
    try {
      // This assumes you have a way to capture screenshots
      // You might need to implement this based on your specific needs
      const screenshot = await captureScreenshot();
      return await analyzeProperty({ screenshot });
    } catch (err) {
      console.error('Failed to capture and analyze:', err);
      throw err;
    }
  };

  return {
    analyzeProperty,
    captureAndAnalyze,
    isProcessing,
    error,
  };
}

// Helper function to capture screenshot - implement based on your needs
async function captureScreenshot(): Promise<string> {
  // This is a placeholder - implement based on your screenshot capture method
  // For example, using html2canvas or browser screenshot API
  throw new Error('Screenshot capture not implemented');
}