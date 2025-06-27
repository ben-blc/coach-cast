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
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/logo_square.png" 
                alt="Coach Bridge" 
                className="w-10 h-10 rounded-xl object-cover"
              />
              <a 
                href="https://bolt.new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <img 
                  src="/bolt-badge.png" 
                  alt="Bolt.new" 
                  className="w-6 h-6"
                />
                <span className="text-sm text-gray-400">Built with Bolt</span>
              </a>
            </div>
            <p className="text-gray-400 text-sm">
              Transform your life with personalized AI and human coaching.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
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
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Coach Bridge. All rights reserved.
          </p>
          {/* <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Link href="#" className="text-gray-400 hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white transition-colors">
              <Linkedin className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white transition-colors">
              <Mail className="w-5 h-5" />
            </Link>
          </div> */}
        </div>
      </div>
    </footer>
  );
}