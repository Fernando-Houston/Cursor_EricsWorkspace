import { NextResponse } from 'next/server';

export async function GET() {
  // Only show first 20 chars of sensitive data
  const maskUrl = (url: string | undefined) => {
    if (!url) return 'NOT SET';
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.username}:***@${u.hostname}:${u.port}${u.pathname}`;
    } catch {
      return url.substring(0, 20) + '...';
    }
  };

  return NextResponse.json({
    DATABASE_URL: maskUrl(process.env.DATABASE_URL),
    GOOGLE_CLOUD_DATABASE_URL: maskUrl(process.env.GOOGLE_CLOUD_DATABASE_URL),
    POSTGRES_URL: maskUrl(process.env.POSTGRES_URL),
    GOOGLE_CLOUD_SQL_HOST: process.env.GOOGLE_CLOUD_SQL_HOST,
    VERCEL_URL: process.env.VERCEL_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
}