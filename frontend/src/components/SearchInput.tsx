import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Rechercher...',
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-light" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 bg-white border border-slate/20 rounded-xl text-dark placeholder:text-slate-light focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
      />
    </div>
  );
};

export default SearchInput;
