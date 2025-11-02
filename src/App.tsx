import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { loadAppData } from './lib/dataLoader';
import type { AppData } from './lib/types';

// Import our main layout component
import Sidebar from './components/layout/Sidebar';

// Import our 4 real pages
import HomePage from './pages/HomePage';
import ActionCenterPage from './pages/ActionCenter';
import StrategyPage from './pages/Strategy';
import DetailsPage from './pages/Details';

function App() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This runs once to load all our data
    const fetchData = async () => {
      const data = await loadAppData();
      setAppData(data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Show a global loading screen until the 150k records are loaded and processed
  if (isLoading || !appData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
        <div className="text-2xl font-bold">Loading & Processing 150k+ Records...</div>
      </div>
    );
  }

  // --- Our New App Layout ---
  // Once loaded, show the Sidebar and the correct Page
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 1. The Sidebar (Static) */}
      <Sidebar />
      
      {/* 2. The Page Content (Dynamic) */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* --- RED BOX TEST --- */}
  
        <Routes>
          {/* We pass the appData prop to every page that needs it */}
          <Route path="/" element={<HomePage appData={appData} />} />
          <Route 
            path="/actions" 
            element={<ActionCenterPage appData={appData} />}
          />
          <Route path="/strategy" element={<StrategyPage appData={appData} />} />
          <Route path="/details" element={<DetailsPage appData={appData} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;