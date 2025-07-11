import React, { useState } from 'react';
import UploadForm from './components/UploadForm';
import PropertyTable from './components/PropertyTable';

interface PropertyInfo {
  propertyAddress: string;
  mailingAddress: string;
  appraisal: string;
  owner: string;
  size: string;
  parcelId: string;
}

export default function Home() {
  const [propertyInfo, setPropertyInfo] = useState<PropertyInfo | null>(null);

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">HCAD Property Info Extractor</h1>
      <UploadForm onResult={setPropertyInfo} />
      {propertyInfo && <PropertyTable info={propertyInfo} />}
    </main>
  );
}
