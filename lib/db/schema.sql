-- Properties table schema for Vercel Postgres
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  account_number VARCHAR(50) UNIQUE NOT NULL,
  owner VARCHAR(255),
  property_address TEXT,
  mailing_address TEXT,
  appraised_value DECIMAL(12, 2),
  land_value DECIMAL(12, 2),
  improvement_value DECIMAL(12, 2),
  total_value DECIMAL(12, 2),
  exemptions TEXT,
  property_type VARCHAR(100),
  year_built INTEGER,
  square_footage INTEGER,
  lot_size VARCHAR(100),
  acreage DECIMAL(10, 4),
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  stories INTEGER,
  exterior_wall VARCHAR(100),
  roof_type VARCHAR(100),
  foundation VARCHAR(100),
  heating VARCHAR(100),
  cooling VARCHAR(100),
  fireplace BOOLEAN DEFAULT FALSE,
  pool BOOLEAN DEFAULT FALSE,
  garage VARCHAR(100),
  neighborhood VARCHAR(255),
  school_district VARCHAR(255),
  parcel_id VARCHAR(50),
  legal_description TEXT,
  tax_year VARCHAR(10),
  confidence DECIMAL(3, 2),
  enhanced_confidence DECIMAL(3, 2),
  date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  processing_stages TEXT[],
  raw_data JSONB
);

-- Create indexes for better query performance
CREATE INDEX idx_properties_account_number ON properties(account_number);
CREATE INDEX idx_properties_owner ON properties(owner);
CREATE INDEX idx_properties_property_address ON properties(property_address);
CREATE INDEX idx_properties_date_added ON properties(date_added DESC);

-- Tax history table
CREATE TABLE IF NOT EXISTS tax_history (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  year VARCHAR(10),
  tax_amount DECIMAL(10, 2),
  tax_rate DECIMAL(5, 4),
  payment_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appraisal history table
CREATE TABLE IF NOT EXISTS appraisal_history (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  year VARCHAR(10),
  land_value DECIMAL(12, 2),
  improvement_value DECIMAL(12, 2),
  total_value DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);