// src/components/layout/Sidebar.tsx

import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ArchiveBoxArrowDownIcon, // For Action Center
  ChartBarSquareIcon, // For Strategy
  MagnifyingGlassIcon, // For Details
  CpuChipIcon, // For the logo
} from '@heroicons/react/24/outline'; 

// Update our navigation array to include icons
const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Action Center', href: '/actions', icon: ArchiveBoxArrowDownIcon },
  { name: 'Strategy', href: '/strategy', icon: ChartBarSquareIcon },
  { name: 'Details', href: '/details', icon: MagnifyingGlassIcon },
];

export default function Sidebar() {
  return (
    <div className="flex w-64 flex-col bg-gray-900 text-white">
      {/* --- Logo Area --- */}
      <div className="flex h-16 flex-shrink-0 items-center gap-x-3 px-6">
        {/* Simple Logo Icon Treatment */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 p-1.5">
          <CpuChipIcon className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold">Blacklane</span>
      </div>

      {/* --- Navigation Area --- */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  // Added 'group' and 'gap-x-3' to align icon/text
                  `group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-800 text-white' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white' 
                  }`
                }
                end={item.href === '/'}
              >
                {/* --- Icon Display --- */}
                <item.icon className="h-6 w-6 flex-shrink-0" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}