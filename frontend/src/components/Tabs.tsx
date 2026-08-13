import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto -mx-1 px-1 pb-1 ${className}`}>
      <div className="flex flex-nowrap gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 shrink-0 ${
              activeTab === tab.id
                ? 'bg-gradient text-white shadow-soft'
                : 'bg-white text-slate hover:bg-primary/10 hover:text-primary'
            }`}
          >
            {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
