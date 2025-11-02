// src/components/layout/Sidebar.tsx

import { NavLink } from 'react-router-dom';

// Simple array for our navigation links
const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Action Center', href: '/actions' },
  { name: 'Strategy', href: '/strategy' },
  { name: 'Details', href: '/details' },
];

export default function Sidebar() {
  return (
    <div className="flex w-64 flex-col bg-gray-900 text-white">
      {/* Simple Text Title */}
      <div className="flex h-16 flex-shrink-0 items-center px-6">
        <h1 className="text-xl font-bold">Blacklane Tech</h1>
      </div>
      
      {/* Navigation Area */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-800 text-white' // Active link style
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white' // Inactive link style
                  }`
                }
                end={item.href === '/'}
              >
                {/* No icon */}
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}