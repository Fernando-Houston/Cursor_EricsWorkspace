'use client';

import LeadsDashboard from '../components/LeadsDashboard';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function LeadsPage() {
  const router = useRouter();
  
  const handleBackToLanding = () => {
    router.push('/');
  };

  return (
    <>
      <Navigation />
      <LeadsDashboard onBackToLanding={handleBackToLanding} />
    </>
  );
}