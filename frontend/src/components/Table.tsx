import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  /** Masquer cette colonne sur mobile (vue cartes) */
  hideOnMobile?: boolean;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  maxHeight?: string;
  loading?: boolean;
  embedded?: boolean;
}

function renderCell<T>(column: Column<T>, item: T) {
  return column.render
    ? column.render(item)
    : ((item as Record<string, unknown>)[column.key] as React.ReactNode);
}

function Table<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'Aucune donnée disponible',
  maxHeight,
  loading = false,
  embedded = false,
}: TableProps<T>) {
  const containerClass = embedded
    ? 'overflow-hidden'
    : 'bg-white rounded-xl sm:rounded-2xl shadow-soft overflow-hidden';

  const mobileColumns = columns.filter((column) => !column.hideOnMobile);

  if (loading) {
    return (
      <div
        className={`${containerClass} flex items-center justify-center text-slate`}
        style={maxHeight ? { minHeight: maxHeight } : { minHeight: '12rem' }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`${containerClass} p-6 sm:p-8 text-center`}>
        <p className="text-slate">{emptyMessage}</p>
      </div>
    );
  }

  const scrollStyle = maxHeight ? { maxHeight } : undefined;

  return (
    <div className={containerClass}>
      {/* Mobile & petites tablettes : cartes */}
      <div className="block md:hidden overflow-y-auto" style={scrollStyle}>
        <div className="divide-y divide-slate/10">
          {data.map((item) => (
            <div
              key={item.id}
              className={`p-4 space-y-3 ${onRowClick ? 'cursor-pointer hover:bg-cloud active:bg-slate/5' : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {mobileColumns.map((column) => (
                <div key={column.key} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start sm:gap-3">
                  <span className="text-xs font-semibold text-slate uppercase tracking-wide shrink-0">
                    {column.header}
                  </span>
                  <div className="text-sm text-dark min-w-0 sm:text-right sm:max-w-[65%]">
                    {renderCell(column, item)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop & tablette large : tableau avec scroll horizontal si besoin */}
      <div className="hidden md:block overflow-x-auto overflow-y-auto" style={scrollStyle}>
        <table className="w-full min-w-[640px]">
          <thead className="sticky top-0 z-10 bg-cloud border-b border-slate/10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`table-header px-3 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-slate-700 uppercase tracking-wider ${column.className?.includes('hidden') ? column.className : ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate/10 bg-white">
            {data.map((item) => (
              <tr
                key={item.id}
                className={`transition-colors duration-200 ${onRowClick ? 'cursor-pointer hover:bg-cloud active:bg-slate/5' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`table-cell px-3 lg:px-6 py-3 lg:py-4 text-sm align-middle ${column.className || ''}`}
                  >
                    {renderCell(column, item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
