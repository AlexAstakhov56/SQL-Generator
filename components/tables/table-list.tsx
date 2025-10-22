// components/multi-table/table-list.tsx
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
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const selectedTable = tables.find((table) => table.id === selectedTableId);

  const startEditing = (table: TableSchema) => {
    setEditingTableId(table.id);
    setEditName(table.name);
  };

  const saveEditing = (tableId: string) => {
    if (editName.trim()) {
      onTableUpdate(tableId, { name: editName.trim() });
    }
    setEditingTableId(null);
    setEditName("");
  };

  const cancelEditing = () => {
    setEditingTableId(null);
    setEditName("");
  };

  if (tables.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Нет таблиц. Добавьте первую таблицу.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Список таблиц */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white border rounded-lg">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                selectedTableId === table.id ? "bg-blue-50 border-blue-200" : ""
              }`}
              onClick={() => !editingTableId && setSelectedTableId(table.id)}
            >
              {editingTableId === table.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEditing(table.id);
                      if (e.key === "Escape") cancelEditing();
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => saveEditing(table.id)}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-gray-900">
                      {table.name}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(table);
                      }}
                      className="text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✏️
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    {table.columns.length} колонок
                  </div>
                  <div className="text-xs text-gray-400">
                    {table.relationships.length} связей
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Редактор выбранной таблицы */}
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
