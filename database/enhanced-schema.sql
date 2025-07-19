-- Enhanced HCAD Database Schema with Historical Tracking
-- This schema supports monthly updates and tracks changes over time

-- 1. Main enhanced properties table (current snapshot)
CREATE TABLE IF NOT EXISTS properties_enhanced (
  -- Original HCAD fields
  account_number VARCHAR PRIMARY KEY,
  owner_name VARCHAR,
  property_address VARCHAR,
  city VARCHAR,
  state VARCHAR,
  zip VARCHAR,
  mail_address VARCHAR,
  mail_city VARCHAR,
  mail_state VARCHAR,
  mail_zip VARCHAR,
  property_type VARCHAR,
  property_class VARCHAR,
  property_class_desc VARCHAR,
  land_value NUMERIC,
  building_value NUMERIC,
  total_value NUMERIC,
  assessed_value NUMERIC,
  area_sqft NUMERIC,
  area_acres NUMERIC,
  year_built INTEGER,
  centroid_lat NUMERIC,
  centroid_lon NUMERIC,
  
  -- Enhanced fields
  first_seen_date DATE DEFAULT CURRENT_DATE,
  last_updated_date DATE DEFAULT CURRENT_DATE,
  last_modified_date DATE,
  owner_changed_date DATE,
  value_changed_date DATE,
  
  -- Computed fields (will be updated via triggers instead of GENERATED)
  property_age INTEGER,
  value_per_acre NUMERIC,
  is_owner_occupied BOOLEAN,
  
  -- ML predictions
  estimated_value NUMERIC,
  confidence_score NUMERIC,
  value_trend VARCHAR, -- 'increasing', 'stable', 'decreasing'
  investment_score INTEGER, -- 1-100
  
  -- Metadata
  data_source VARCHAR DEFAULT 'HCAD',
  import_batch_id UUID,
  is_active BOOLEAN DEFAULT true
);

-- 2. Historical tracking table
CREATE TABLE IF NOT EXISTS property_history (
  id SERIAL PRIMARY KEY,
  account_number VARCHAR,
  field_name VARCHAR,
  old_value TEXT,
  new_value TEXT,
  change_date DATE DEFAULT CURRENT_DATE,
  change_type VARCHAR, -- 'owner_change', 'value_change', 'address_change'
  import_batch_id UUID,
  
  FOREIGN KEY (account_number) REFERENCES properties_enhanced(account_number)
);

-- 3. Owner tracking
CREATE TABLE IF NOT EXISTS owner_portfolio (
  owner_name VARCHAR PRIMARY KEY,
  first_seen_date DATE DEFAULT CURRENT_DATE,
  last_active_date DATE DEFAULT CURRENT_DATE,
  total_properties INTEGER DEFAULT 0,
  total_acres NUMERIC DEFAULT 0,
  total_portfolio_value NUMERIC DEFAULT 0,
  avg_property_value NUMERIC DEFAULT 0,
  properties_acquired INTEGER DEFAULT 0,
  properties_sold INTEGER DEFAULT 0,
  is_institutional BOOLEAN DEFAULT false,
  owner_type VARCHAR -- 'individual', 'llc', 'trust', 'corporate'
);

-- 4. Market analytics table
CREATE TABLE IF NOT EXISTS market_analytics (
  id SERIAL PRIMARY KEY,
  zip VARCHAR,
  month DATE,
  total_properties INTEGER,
  avg_value NUMERIC,
  median_value NUMERIC,
  total_transactions INTEGER,
  new_listings INTEGER,
  value_appreciation_pct NUMERIC,
  investor_activity_pct NUMERIC
);

-- 5. Import tracking
CREATE TABLE IF NOT EXISTS import_batches (
  batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_name VARCHAR,
  total_records INTEGER,
  new_records INTEGER,
  updated_records INTEGER,
  error_records INTEGER,
  processing_time_ms INTEGER,
  status VARCHAR DEFAULT 'pending' -- 'pending', 'processing', 'completed', 'failed'
);

-- 6. Data quality tracking
CREATE TABLE IF NOT EXISTS data_quality_issues (
  id SERIAL PRIMARY KEY,
  account_number VARCHAR,
  issue_type VARCHAR, -- 'missing_value', 'invalid_format', 'outlier'
  field_name VARCHAR,
  issue_description TEXT,
  import_batch_id UUID,
  resolved BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX idx_owner_name ON properties_enhanced(owner_name);
CREATE INDEX idx_property_address ON properties_enhanced(property_address);
CREATE INDEX idx_zip ON properties_enhanced(zip);
CREATE INDEX idx_city ON properties_enhanced(city);
CREATE INDEX idx_mail_address ON properties_enhanced(mail_address);
CREATE INDEX idx_total_value ON properties_enhanced(total_value);
CREATE INDEX idx_coordinates ON properties_enhanced(centroid_lat, centroid_lon);
CREATE INDEX idx_last_updated ON properties_enhanced(last_updated_date);

-- Useful views
CREATE OR REPLACE VIEW recent_changes AS
SELECT 
  ph.*,
  pe.property_address,
  pe.owner_name
FROM property_history ph
JOIN properties_enhanced pe ON ph.account_number = pe.account_number
WHERE ph.change_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY ph.change_date DESC;

CREATE OR REPLACE VIEW high_value_properties AS
SELECT *
FROM properties_enhanced
WHERE total_value > 1000000
  OR estimated_value > 1000000
ORDER BY COALESCE(total_value, estimated_value) DESC;

CREATE OR REPLACE VIEW investment_opportunities AS
SELECT 
  account_number,
  property_address,
  owner_name,
  total_value,
  estimated_value,
  (estimated_value - total_value) as potential_gain,
  investment_score
FROM properties_enhanced
WHERE estimated_value > total_value * 1.2
  AND investment_score > 70
  AND NOT is_owner_occupied
ORDER BY investment_score DESC;

-- Function to update computed fields
CREATE OR REPLACE FUNCTION update_computed_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Update property age
  IF NEW.year_built IS NOT NULL THEN
    NEW.property_age := EXTRACT(YEAR FROM CURRENT_DATE) - NEW.year_built;
  END IF;
  
  -- Update value per acre
  IF NEW.area_acres IS NOT NULL AND NEW.area_acres > 0 AND NEW.total_value IS NOT NULL THEN
    NEW.value_per_acre := NEW.total_value / NEW.area_acres;
  END IF;
  
  -- Update owner occupied status
  NEW.is_owner_occupied := (NEW.property_address = NEW.mail_address);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update computed fields
CREATE TRIGGER trigger_update_computed_fields
BEFORE INSERT OR UPDATE ON properties_enhanced
FOR EACH ROW
EXECUTE FUNCTION update_computed_fields();