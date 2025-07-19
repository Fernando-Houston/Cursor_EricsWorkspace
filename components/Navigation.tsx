'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, Brain, Database, TrendingUp } from 'lucide-react';

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
  },
  {
    href: '/analytics/overview',
    label: 'Analytics',
    icon: BarChart3,
  },
  {
    href: '/analytics/insights',
    label: 'AI Insights',
    icon: Brain,
  },
  {
    href: '/leads',
    label: 'Leads',
    icon: Database,
  },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold">HCAD Analytics</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => {
                // Toggle mobile menu
                const mobileMenu = document.getElementById('mobile-menu');
                mobileMenu?.classList.toggle('hidden');
              }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden hidden" id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-gray-800 dark:text-blue-400'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}