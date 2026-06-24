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
      <div className="bg-white rounded-2xl shadow-soft p-8 text-center">
        <p className="text-slate">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-cloud border-b border-slate/10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`table-header px-6 py-4 ${column.className || ''}`}
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
                className={`transition-colors duration-200 ${onRowClick ? 'cursor-pointer hover:bg-cloud' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`table-cell px-6 ${column.className || ''}`}>
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
