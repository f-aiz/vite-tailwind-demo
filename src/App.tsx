import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { loadAppData } from './lib/dataLoader';
import type { AppData } from './lib/types';
import Sidebar from './components/layout/Sidebar';
import HomePage from './pages/HomePage';
import ActionCenterPage from './pages/ActionCenter';
import StrategyPage from './pages/Strategy';
import DetailsPage from './pages/Details';

function App() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await loadAppData();
      setAppData(data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading || !appData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
        <div className="text-2xl font-bold">Loading & Processing 150k+ Records...</div>
      </div>
    );
  }

  return (
    // Main layout is light theme
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      {/* Page content area has light gray background */}
      <main className="flex-1 overflow-y-auto bg-gray-100 p-8">
        <Routes>
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