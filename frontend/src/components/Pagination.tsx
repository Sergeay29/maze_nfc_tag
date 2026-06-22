import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const getVisiblePages = () => {
    if (totalPages <= 5) return pages;
    if (currentPage <= 3) return pages.slice(0, 5);
    if (currentPage >= totalPages - 2) return pages.slice(-5);
    return pages.slice(currentPage - 3, currentPage + 2);
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-white text-slate hover:bg-primary/10 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {getVisiblePages().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
            currentPage === page
              ? 'bg-gradient text-white shadow-soft'
              : 'bg-white text-slate hover:bg-primary/10 hover:text-primary'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-white text-slate hover:bg-primary/10 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Pagination;
