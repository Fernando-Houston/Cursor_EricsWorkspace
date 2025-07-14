# HCAD Property Extraction Platform

A Next.js 15 AI-powered property extraction application that extracts property data from Harris County Appraisal District (HCAD) screenshots and enhances it with official HCAD records.

## 🚀 Features

### Property Data Extraction
- **AI Vision Processing**: Uses OpenAI GPT-4 Vision to extract property data from HCAD screenshots
- **HCAD Integration**: Retrieves official property records from HCAD website using parcel IDs
- **Dual-Stage Processing**: Vision extraction followed by official record enhancement

### Data Fields Extracted
- 👤 **Owner Information**: Owner name and mailing address
- 🏠 **Property Details**: Property address, legal description, land area
- 💰 **Valuation Data**: Land value, improvement value, total appraised value
- 📊 **Classification**: State class code, land use code, neighborhood
- 🏘️ **Additional Details**: Market area, total living area, tax year

### User Interface
- **Mobile-Optimized**: Responsive design for mobile and desktop
- **Real-Time Processing**: Live progress updates during extraction
- **Results Dashboard**: Multi-tab interface for detailed property information
- **Leads Management**: Save and manage extracted property leads
- **Data Export**: Export results to CSV and Excel formats

## 🛠️ Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Next.js API Routes
- **AI Services**: OpenAI GPT-4 Vision API
- **Data Processing**: Custom HTML parsing for HCAD records
- **Storage**: LocalStorage for leads persistence

## 📋 Prerequisites

- Node.js 18+ 
- OpenAI API Key
- Modern web browser

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Fernando-Houston/Cursor_EricsWorkspace.git
   cd Cursor_EricsWorkspace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3001`

## 🧪 Testing

The project includes comprehensive testing scripts:

### Test HCAD Integration
```bash
npm run test-hcad
```

### Test Full Extraction Pipeline
```bash
npm run test-extraction
```

To test with a real HCAD screenshot:
1. Save your screenshot as `test-screenshot.png` in the project root
2. Run the test extraction script

## 🎯 Usage

1. **Upload Screenshot**: Take a screenshot of the HCAD property search results page
2. **Extract Data**: The AI will extract property information from the image
3. **Enhance with HCAD**: System retrieves official records using the parcel ID
4. **Review Results**: View detailed property information in the dashboard
5. **Save to Leads**: Add properties to your leads database
6. **Export Data**: Download results in CSV or Excel format

## 📊 Data Structure

The system extracts and structures the following data:

```typescript
interface PropertyData {
  ownerName: string;
  propertyAddress: string;
  mailingAddress: string;
  legalDescription: string;
  stateClassCode: string;
  landUseCode: string;
  landArea: string;
  totalLivingArea: string;
  neighborhood: string;
  marketArea: string;
  landValue: string;
  improvementValue: string;
  totalValuation: string;
  taxYear: string;
  // Enhanced data from HCAD
  hcadData: HCADRecord;
  enhancedConfidence: number;
  enhancedBy: string;
}
```

## 🔧 API Endpoints

### POST `/api/property-info`
Extract property data from uploaded image
- **Input**: FormData with image file
- **Output**: Structured property data

### POST `/api/hcad-search`
Search HCAD records by parcel ID
- **Input**: `{ parcelId: string }`
- **Output**: Official HCAD property record

## 🌟 Key Features Implemented

### 1. Safari Compatibility
- Added `requestIdleCallback` polyfill for Safari browsers
- Improved React 19 compatibility

### 2. HCAD Data Integration
- Mock implementation based on actual HCAD record structure
- Comprehensive data extraction from official records
- Enhanced property information with official valuations

### 3. Leads Management
- Persistent storage using localStorage
- Real-time updates across browser tabs
- Complete CRUD operations for leads

### 4. Enhanced UI/UX
- Beautiful "Save to Leads" functionality
- Detailed property information display
- Mobile-responsive design
- Real-time processing feedback

## 🎨 UI Components

- **UploadForm**: Drag-and-drop image upload
- **PropertyTable**: Detailed property information display
- **LeadsDashboard**: Leads management interface
- **LoadingProgress**: Real-time processing feedback
- **MobileModal**: Mobile-optimized result display

## 📝 Example Usage

```javascript
// Upload and extract property data
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/property-info', {
  method: 'POST',
  body: formData
});

const propertyData = await response.json();
```

## 🔒 Security

- API key stored in environment variables
- Input validation for file uploads
- CORS headers configured for API endpoints
- File size limits (10MB maximum)

## 🚧 Future Enhancements

- Real HCAD website scraping (currently uses mock data)
- Database integration for persistent storage
- User authentication and accounts
- Batch processing for multiple properties
- Advanced analytics and reporting

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For questions or support, please contact the development team.

---

**Note**: The HCAD integration currently uses mock data based on the actual HCAD website structure. In production, this would be replaced with actual web scraping of the HCAD website at https://hcad.org/property-search/real-property/real-property-search-by-account-number.
