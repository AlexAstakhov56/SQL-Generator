"use client";

import { useState } from "react";
import { TableSchema } from "../../lib/types";
import { TableEditor } from "../forms/table-editor";

interface TableListProps {
  tables: TableSchema[];
  onTableUpdate: (tableId: string, updates: Partial<TableSchema>) => void;
  onTableDelete: (tableId: string) => void;
}

export function TableList({
  tables,
  onTableUpdate,
  onTableDelete,
}: TableListProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(
    tables[0]?.id || null
  );

  const selectedTable = tables.find((table) => table.id === selectedTableId);

  if (tables.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Нет таблиц. Добавьте первую таблицу.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <div className="w-64 flex-shrink-0">
        <div className="bg-white border rounded-lg">
          {tables.map((table) => (
            <div
              key={table.id}
              onClick={() => setSelectedTableId(table.id)}
              className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                selectedTableId === table.id ? "bg-blue-50 border-blue-200" : ""
              }`}
            >
              <div className="font-medium text-gray-900">{table.name}</div>
              <div className="text-sm text-gray-500">
                {table.columns.length} колонок
              </div>
              <div className="text-xs text-gray-400">
                {table.relationships.length} связей
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1">
        {selectedTable && (
          <div className="bg-white border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                Редактирование: {selectedTable.name}
              </h3>
              <button
                onClick={() => onTableDelete(selectedTable.id)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Удалить таблицу
              </button>
            </div>

            <TableEditor
              table={selectedTable}
              onTableChange={(updates) =>
                onTableUpdate(selectedTable.id, updates)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
