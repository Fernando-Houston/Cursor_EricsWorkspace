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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
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
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/property-info', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to process image.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      onResult(data);
      setLoading(false);
    } catch {
      setError('An error occurred.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-start">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        disabled={loading || !file}
      >
        {loading ? 'Processing...' : 'Upload Screenshot'}
      </button>
      {error && <div className="text-red-600">{error}</div>}
    </form>
  );
};

export default UploadForm; 