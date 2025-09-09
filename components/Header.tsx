import React from 'react';

type View = 'design' | 'cost';

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const getButtonClasses = (view: View) => {
    const baseClasses = "px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";
    if (currentView === view) {
      return `${baseClasses} bg-blue-600 text-white shadow-sm`;
    }
    return `${baseClasses} text-gray-600 hover:bg-gray-200 hover:text-gray-900`;
  };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="text-left">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Whiteout AI
            </h1>
            <p className="hidden sm:block mt-1 text-xs text-gray-500">
              Crafting minimalist and elegant spaces
            </p>
        </div>
        <nav className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
          <button onClick={() => onViewChange('design')} className={getButtonClasses('design')}>
            Design Studio
          </button>
          <button onClick={() => onViewChange('cost')} className={getButtonClasses('cost')}>
            Cost Estimator
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
