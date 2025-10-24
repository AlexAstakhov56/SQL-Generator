"use client";

import { useState } from "react";
import {
  TableSchema,
  ColumnDefinition,
  IndexDefinition,
} from "../../lib/types";
import { createDefaultColumn } from "../../lib/utils/schema-utils";
import { ColumnEditor } from "./column-editor";
import { IndexEditor } from "./index-editor";
import { DataEditor } from "./data-editor";

interface TableEditorProps {
  table: TableSchema;
  onTableChange: (updates: Partial<TableSchema>) => void;
}

export function TableEditor({ table, onTableChange }: TableEditorProps) {
  const [activeTab, setActiveTab] = useState<"columns" | "data">("columns");

  const handleDataChange = (data: Record<string, any>[]) => {
    onTableChange({ data });
  };

  // Работа с колонками
  const addColumn = () => {
    const newColumn = createDefaultColumn();
    const updatedColumns = [...table.columns, newColumn];
    onTableChange({ columns: updatedColumns });
  };

  const updateColumn = (
    columnId: string,
    updates: Partial<ColumnDefinition>
  ) => {
    const updatedColumns = table.columns.map((column) =>
      column.id === columnId ? { ...column, ...updates } : column
    );
    onTableChange({ columns: updatedColumns });
  };

  const removeColumn = (columnId: string) => {
    const updatedColumns = table.columns.filter(
      (column) => column.id !== columnId
    );
    onTableChange({ columns: updatedColumns });
  };

  const moveColumn = (columnId: string, direction: "up" | "down") => {
    const currentIndex = table.columns.findIndex((col) => col.id === columnId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= table.columns.length) return;

    const updatedColumns = [...table.columns];
    const [movedColumn] = updatedColumns.splice(currentIndex, 1);
    updatedColumns.splice(newIndex, 0, movedColumn);

    onTableChange({ columns: updatedColumns });
  };

  // Работа с индексами
  // const addIndex = () => {
  //   const newIndex: IndexDefinition = {
  //     id: `index_${Date.now()}`,
  //     name: `idx_${table.name}_${table.indexes.length + 1}`,
  //     type: "BTREE",
  //     columns: [],
  //     unique: false,
  //     dbSpecific: {
  //       mysql: {},
  //       postgresql: {},
  //       sqlite: {},
  //     },
  //   };
  //   const updatedIndexes = [...table.indexes, newIndex];
  //   onTableChange({ indexes: updatedIndexes });
  // };

  // const updateIndex = (indexId: string, updates: any) => {
  //   const updatedIndexes = table.indexes.map((index) =>
  //     index.id === indexId ? { ...index, ...updates } : index
  //   );
  //   onTableChange({ indexes: updatedIndexes });
  // };

  // const removeIndex = (indexId: string) => {
  //   const updatedIndexes = table.indexes.filter(
  //     (index) => index.id !== indexId
  //   );
  //   onTableChange({ indexes: updatedIndexes });
  // };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-600">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("columns")}
            className={`py-2 px-1 cursor-pointer border-b-2 font-semibold text-md ${
              activeTab === "columns"
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🏗️ Колонки ({table.columns.length})
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`py-2 px-1 cursor-pointer border-b-2 font-semibold text-md ${
              activeTab === "data"
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📝 Данные ({table.data?.length || 0})
          </button>
          {/* <button
            onClick={() => setActiveTab("indexes")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "indexes"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📊 Индексы ({table.indexes.length})
          </button> */}
        </nav>
      </div>

      {/* Содержимое вкладок */}
      {activeTab === "columns" && (
        <ColumnEditor
          columns={table.columns}
          onAddColumn={addColumn}
          onUpdateColumn={updateColumn}
          onRemoveColumn={removeColumn}
          onMoveColumn={moveColumn}
        />
      )}

      {activeTab === "data" && (
        <DataEditor table={table} onDataChange={handleDataChange} />
      )}

      {/* {activeTab === "indexes" && (
        <IndexEditor
          indexes={table.indexes}
          columns={table.columns}
          onAddIndex={addIndex}
          onUpdateIndex={updateIndex}
          onRemoveIndex={removeIndex}
        />
      )} */}
    </div>
  );
}
