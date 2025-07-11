import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';
import puppeteer from 'puppeteer';

export const runtime = 'nodejs';
export const maxDuration = 60; // Increase timeout to 60 seconds

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Save the uploaded file to a temp location
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = path.join('/tmp', `${Date.now()}-${file.name}`);
    await fs.writeFile(tempPath, buffer);

    // 1. OCR
    const worker = await createWorker('eng');
    const { data: { text: ocrText } } = await worker.recognize(tempPath);
    await worker.terminate();

    // 2. Extract parcel ID (simple regex, improve as needed)
    const parcelIdMatch = ocrText.match(/\d{12,}/);
    const parcelId = parcelIdMatch ? parcelIdMatch[0] : '';
    
    if (!parcelId) {
      await fs.unlink(tempPath);
      return NextResponse.json({ 
        error: 'Parcel ID not found in image. Please ensure the image contains a valid parcel ID.' 
      }, { status: 400 });
    }

    // 3. Scrape HCAD
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto('https://public.hcad.org/records/Real.asp?search=acct');
    await page.type('input[name="acct"]', parcelId);
    await page.click('input[type="submit"]');
    await page.waitForNavigation();

    // Scrape property details (update selectors as needed)
    const result = await page.evaluate(() => {
      const getText = (label: string) => {
        const el = Array.from(document.querySelectorAll('td')).find(td => td.textContent?.includes(label));
        return el?.nextElementSibling?.textContent?.trim() || '';
      };
      return {
        propertyAddress: getText('Property Address'),
        mailingAddress: getText('Mailing Address'),
        appraisal: getText('Appraised Value') || getText('Total Value'),
        owner: getText('Owner Name'),
        size: getText('Land Area') || getText('Size'),
      };
    });

    await browser.close();
    await fs.unlink(tempPath);

    return NextResponse.json({
      ...result,
      parcelId,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'An error occurred while processing the image. Please try again.' 
    }, { status: 500 });
  }
} 