import React, { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import Reports from './pages/Reports'
import ErrorBoundary from './components/ErrorBoundary'

type PageType = 'dashboard' | 'search' | 'reports';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  useEffect(() => {
    const handleNavigate = (event: CustomEvent<{ page: string }>) => {
      setCurrentPage(event.detail.page as PageType);
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => window.removeEventListener('navigate', handleNavigate as EventListener);
  }, []);

  const navigation = [
    { name: 'Dashboard', key: 'dashboard' as PageType, icon: '📊' },
    { name: 'Search', key: 'search' as PageType, icon: '🔍' },
    { name: 'Reports', key: 'reports' as PageType, icon: '📈' },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'search':
        return <Search />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Simple Navigation Header */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                {/* Logo */}
                <div className="flex-shrink-0 flex items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">N</span>
                    </div>
                    <span className="ml-2 text-xl font-bold text-gray-900">Newsroom Dashboard</span>
                  </div>
                </div>
                
                {/* Navigation Links */}
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setCurrentPage(item.key)}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                        currentPage === item.key
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">System Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCurrentPage(item.key)}
                  className={`block w-full text-left pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                    currentPage === item.key
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main>
          {renderPage()}
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App
