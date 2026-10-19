import { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface VerticalTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function VerticalTabs({ tabs, activeTab, onTabChange }: VerticalTabsProps) {
  return (
    <div className="w-64 flex-shrink-0 border-r border-gray-200 pr-6">
      <nav className="space-y-1" aria-label="Settings tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors
                ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              {tab.icon && <span className="w-5 h-5 flex-shrink-0">{tab.icon}</span>}
              <span className="text-sm">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

