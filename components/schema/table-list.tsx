// components/multi-table/table-list.tsx
"use client";

import { useState } from "react";
import { TableSchema } from "../../lib/types";
import { TableEditor } from "../forms/table-editor";
import { Button } from "../ui/button";

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
    tables[0]?.id || null,
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
    <div className="flex flex-col md:flex-row gap-4 md:gap-6">
      {/* Боковая панель со списком таблиц */}
      <div className="w-full md:w-64 md:flex-shrink-0">
        <div className="bg-white border-2 rounded-lg md:rounded-none">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`p-3 md:p-4 border-b last:border-b-0 cursor-pointer hover:bg-blue-200 transition duration-200 ${
                selectedTableId === table.id ? "bg-blue-300 " : ""
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
                    className="w-full px-2 py-1.5 md:py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEditing(table.id)}
                      className="text-xs md:text-sm bg-green-500 text-white px-2 md:px-3 py-1 rounded hover:bg-green-600 transition"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-xs md:text-sm bg-gray-500 text-white px-2 md:px-3 py-1 rounded hover:bg-gray-600 transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-medium text-base md:text-lg lg:text-xl text-gray-900 break-words flex-1">
                      {table.name}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(table);
                      }}
                      className="text-gray-400 cursor-pointer hover:text-gray-600 text-sm md:text-base flex-shrink-0"
                      aria-label="Редактировать"
                    >
                      ✏️
                    </button>
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 mt-1">
                    Колонок: {table.columns.length}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">
                    Связей: {table.relationships.length}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Основная область с редактором */}
      <div className="flex-1">
        {selectedTable && (
          <div className="bg-violet-300 border rounded-lg p-4 md:p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-5 lg:mb-6">
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold break-words">
                Редактирование: {selectedTable.name}
              </h3>
              <Button
                variant="danger"
                onClick={() => onTableDelete(selectedTable.id)}
                className="w-full sm:w-auto text-sm md:text-base"
              >
                Удалить таблицу
              </Button>
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
