// Google Cloud Database Connection
// Supports Cloud SQL (PostgreSQL/MySQL) or Firestore

import { Pool } from 'pg';

// For Google Cloud SQL (PostgreSQL)
const googleCloudPool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.GOOGLE_CLOUD_DATABASE_URL || 
    `postgresql://${process.env.GOOGLE_CLOUD_SQL_USER}:${process.env.GOOGLE_CLOUD_SQL_PASSWORD}@${process.env.GOOGLE_CLOUD_SQL_HOST}:${process.env.GOOGLE_CLOUD_SQL_PORT}/${process.env.GOOGLE_CLOUD_SQL_DATABASE}`,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

export interface PropertySearchResult {
  accountNumber: string;
  owner: string;
  propertyAddress: string;
  mailingAddress?: string;
  appraisedValue?: number;
  landValue?: number;
  improvementValue?: number;
  totalValue?: number;
  yearBuilt?: number;
  squareFootage?: number;
  lotSize?: string;
  propertyType?: string;
  [key: string]: string | number | boolean | null | undefined;
}

// Search by account number
export async function searchByAccountNumber(accountNumber: string): Promise<PropertySearchResult | null> {
  const client = await googleCloudPool.connect();
  try {
    const query = `
      SELECT 
        account_number as "accountNumber",
        owner_name as "owner",
        property_address as "propertyAddress",
        COALESCE(mail_address, property_address) as "mailingAddress",
        total_value as "appraisedValue",
        land_value as "landValue",
        building_value as "improvementValue",
        total_value as "totalValue",
        year_built as "yearBuilt",
        area_sqft as "squareFootage",
        CONCAT(area_acres, ' acres') as "lotSize",
        property_type as "propertyType",
        city,
        state,
        zip,
        property_class_desc as "propertyClass",
        assessed_value as "assessedValue",
        centroid_lat as "latitude",
        centroid_lon as "longitude",
        extra_data
      FROM properties
      WHERE account_number = $1
      LIMIT 1
    `;
    
    const result = await client.query(query, [accountNumber]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error searching Google Cloud database:', error);
    return null;
  } finally {
    client.release();
  }
}

// Search by address
export async function searchByAddress(address: string): Promise<PropertySearchResult | null> {
  const client = await googleCloudPool.connect();
  try {
    const query = `
      SELECT 
        account_number as "accountNumber",
        owner_name as "owner",
        property_address as "propertyAddress",
        COALESCE(mail_address, property_address) as "mailingAddress",
        total_value as "appraisedValue",
        land_value as "landValue",
        building_value as "improvementValue",
        total_value as "totalValue",
        year_built as "yearBuilt",
        area_sqft as "squareFootage",
        CONCAT(area_acres, ' acres') as "lotSize",
        property_type as "propertyType",
        city,
        state,
        zip
      FROM properties
      WHERE LOWER(property_address) LIKE LOWER($1)
      LIMIT 1
    `;
    
    const result = await client.query(query, [`%${address}%`]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error searching by address:', error);
    return null;
  } finally {
    client.release();
  }
}

// Search by owner name
export async function searchByOwner(ownerName: string): Promise<PropertySearchResult[]> {
  const client = await googleCloudPool.connect();
  try {
    const query = `
      SELECT 
        account_number as "accountNumber",
        owner,
        property_address as "propertyAddress",
        mailing_address as "mailingAddress",
        appraised_value as "appraisedValue",
        land_value as "landValue",
        improvement_value as "improvementValue",
        total_value as "totalValue"
      FROM properties
      WHERE LOWER(owner) LIKE LOWER($1)
      LIMIT 10
    `;
    
    const result = await client.query(query, [`%${ownerName}%`]);
    return result.rows;
  } catch (error) {
    console.error('Error searching by owner:', error);
    return [];
  } finally {
    client.release();
  }
}

// For Firestore (alternative)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function searchFirestore(_accountNumber: string) {
  // If using Firestore instead of Cloud SQL
  // const { Firestore } = require('@google-cloud/firestore');
  // const firestore = new Firestore();
  // const doc = await firestore.collection('properties').doc(_accountNumber).get();
  // return doc.exists ? doc.data() : null;
  return null;
}