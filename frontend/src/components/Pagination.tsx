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
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const getVisiblePages = () => {
    if (totalPages <= 5) return pages;
    if (currentPage <= 3) return pages.slice(0, 5);
    if (currentPage >= totalPages - 2) return pages.slice(-5);
    return pages.slice(currentPage - 3, currentPage + 2);
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Page précédente"
        className="inline-flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg bg-white text-slate hover:bg-primary/10 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden xs:inline">Préc.</span>
      </button>

      {visiblePages.map((page) => (
        <button
          type="button"
          key={page}
          onClick={() => onPageChange(page)}
          aria-current={currentPage === page ? 'page' : undefined}
          className={`min-w-[2.25rem] sm:min-w-[2.5rem] h-9 sm:h-10 px-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            currentPage === page
              ? 'bg-gradient text-white shadow-soft'
              : 'bg-white text-slate hover:bg-primary/10 hover:text-primary'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Page suivante"
        className="inline-flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg bg-white text-slate hover:bg-primary/10 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
      >
        <span className="hidden xs:inline">Suiv.</span>
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
};

export default Pagination;
