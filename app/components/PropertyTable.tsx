import React from 'react';
import Papa from 'papaparse';

interface PropertyInfo {
  propertyAddress: string;
  mailingAddress: string;
  appraisal: string;
  owner: string;
  size: string;
  parcelId: string;
}

interface PropertyTableProps {
  info: PropertyInfo;
}

const PropertyTable: React.FC<PropertyTableProps> = ({ info }) => {
  const handleExportCSV = () => {
    const csv = Papa.unparse([
      {
        'Property Address': info.propertyAddress,
        'Mailing Address': info.mailingAddress,
        'HCAD Appraisal': info.appraisal,
        'Property Owner': info.owner,
        'Size': info.size,
        'Parcel ID': info.parcelId,
      },
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'property-info.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-6">
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Property Address</th>
            <th className="border px-4 py-2">Mailing Address</th>
            <th className="border px-4 py-2">HCAD Appraisal</th>
            <th className="border px-4 py-2">Property Owner</th>
            <th className="border px-4 py-2">Size</th>
            <th className="border px-4 py-2">Parcel ID</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2">{info.propertyAddress}</td>
            <td className="border px-4 py-2">{info.mailingAddress}</td>
            <td className="border px-4 py-2">{info.appraisal}</td>
            <td className="border px-4 py-2">{info.owner}</td>
            <td className="border px-4 py-2">{info.size}</td>
            <td className="border px-4 py-2">{info.parcelId}</td>
          </tr>
        </tbody>
      </table>
      <button
        onClick={handleExportCSV}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
      >
        Export as CSV
      </button>
    </div>
  );
};

export default PropertyTable; 