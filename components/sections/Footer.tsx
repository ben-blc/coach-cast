'use client';

import Link from 'next/link';
import { Twitter, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  // Function to handle navigation to sections
  const handleSectionNavigation = (sectionId: string) => {
    // Check if we're on the home page
    if (window.location.pathname === '/') {
      // If on home page, scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If not on home page, navigate to home page with hash
      window.location.href = `/#${sectionId}`;
    }
  };

  const handleHomeNavigation = () => {
    window.location.href = '/';
  };

  return (
    <footer className="bg-content-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/logo_long_neg.png" 
                alt="CoachBridge" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-gray-400 text-sm">
              Transform your life with personalized AI and human coaching.
            </p>
            <a 
              href="https://bolt.new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <img 
                src="/bolt-badge.png" 
                alt="Bolt.new" 
                className="w-6 h-6"
              />
              <span className="text-sm">Built with Bolt</span>
            </a>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Product</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button 
                  onClick={handleHomeNavigation}
                  className="hover:text-white transition-colors text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleSectionNavigation('features')}
                  className="hover:text-white transition-colors text-left"
                >
                  Features
                </button>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => handleSectionNavigation('coaches')}
                  className="hover:text-white transition-colors text-left"
                >
                  For Coaches
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} CoachBridge. All rights reserved.
          </p>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <span className="text-xs text-gray-500">Powered by AI, Guided by Humanity</span>
          </div>
        </div>
      </div>
    </footer>
  );
}