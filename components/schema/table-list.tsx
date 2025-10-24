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
      <div className="w-64 flex-shrink-0">
        <div className="bg-white border-2">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`p-3 border cursor-pointer hover:bg-blue-200 transition duration-200 ${
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
                    <div className="font-medium text-lg text-gray-900">
                      {table.name}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(table);
                      }}
                      className="text-gray-400 cursor-pointer hover:text-gray-600 text-xs"
                    >
                      ✏️
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Колонок: {table.columns.length}
                  </div>
                  <div className="text-sm text-gray-500">
                    Связей: {table.relationships.length}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1">
        {selectedTable && (
          <div className="bg-violet-300 border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">
                Редактирование: {selectedTable.name}
              </h3>
              <Button
                variant="danger"
                onClick={() => onTableDelete(selectedTable.id)}
              >
                Удалить таблицу
              </Button>
              {/* <button
                onClick={() => onTableDelete(selectedTable.id)}
                className="text-red-500 transition duration-200 cursor-pointer hover:text-red-600 text-md"
              >
                Удалить таблицу
              </button> */}
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
