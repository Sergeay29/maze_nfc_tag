import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

function Table<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'Aucune donnée disponible',
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft p-6 sm:p-8 text-center">
        <p className="text-slate">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft overflow-hidden">
      {/* Version mobile : cartes empilées */}
      <div className="block sm:hidden">
        <div className="divide-y divide-slate/10">
          {data.map((item) => (
            <div
              key={item.id}
              className={`p-4 space-y-3 ${onRowClick ? 'cursor-pointer hover:bg-cloud active:bg-slate/5' : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.slice(0, 3).map((column) => (
                <div key={column.key} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-slate-600 min-w-0 flex-shrink-0 mr-3">
                    {column.header}:
                  </span>
                  <div className="text-sm text-right min-w-0 flex-1">
                    {column.render ? column.render(item) : (item as Record<string, unknown>)[column.key] as React.ReactNode}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Version desktop : tableau classique */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-cloud border-b border-slate/10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`table-header px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-slate-700 uppercase tracking-wider whitespace-nowrap ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate/10">
            {data.map((item) => (
              <tr
                key={item.id}
                className={`transition-colors duration-200 ${onRowClick ? 'cursor-pointer hover:bg-cloud active:bg-slate/5' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`table-cell px-4 lg:px-6 py-3 lg:py-4 text-sm whitespace-nowrap ${column.className || ''}`}>
                    {column.render ? column.render(item) : (item as Record<string, unknown>)[column.key] as React.ReactNode}
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
