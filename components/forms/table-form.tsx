// components/forms/table-form.tsx
"use client";

import { useState } from "react";
import { TableSchema, ColumnDefinition, Constraint } from "../../lib/types";
import {
  createDefaultTable,
  createDefaultColumn,
} from "../../lib/utils/schema-utils";
import { constraintUtils } from "../../lib/utils/constraint-utils";
import { Button } from "../ui/button";
import { TableStructure } from "./table-structure";
import { TableData } from "./table-data";

interface TableFormProps {
  onSubmit: (schema: TableSchema) => void;
  onTest?: (schema: TableSchema) => void;
  isTesting?: boolean;
  isGenerating?: boolean;
  initialData?: TableSchema;
}

export function TableForm({
  onSubmit,
  onTest,
  initialData,
  isGenerating = false,
  isTesting = false,
}: TableFormProps) {
  const [schema, setSchema] = useState<TableSchema>(
    initialData || createDefaultTable()
  );
  const [activeTab, setActiveTab] = useState<"structure" | "data">("structure");

  const updateSchema = (updates: Partial<TableSchema>) => {
    setSchema((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date(),
    }));
  };

  const addColumn = () => {
    const newColumn = createDefaultColumn();
    updateSchema({
      columns: [...schema.columns, newColumn],
    });
  };

  const updateColumn = (
    columnId: string,
    updates: Partial<ColumnDefinition>
  ) => {
    const updatedColumns = schema.columns.map((column) =>
      column.id === columnId ? { ...column, ...updates } : column
    );
    updateSchema({ columns: updatedColumns });
  };

  const removeColumn = (columnId: string) => {
    const updatedColumns = schema.columns.filter(
      (column) => column.id !== columnId
    );
    updateSchema({ columns: updatedColumns });
  };

  const handleSubmit = () => {
    onSubmit(schema);
  };

  const handleTest = () => {
    onTest?.(schema);
  };

  // Вспомогательные функции для работы с constraints
  const hasConstraint = (
    column: ColumnDefinition,
    constraint: Constraint
  ): boolean => {
    return constraintUtils.hasConstraint(column, constraint);
  };

  const getPrimaryKeyColumns = (): ColumnDefinition[] => {
    return schema.columns.filter((column) =>
      hasConstraint(column, "PRIMARY_KEY")
    );
  };

  // Проверяем, можно ли генерировать SQL (базовая валидация)
  const canGenerateSQL =
    schema.name &&
    schema.columns.length > 0 &&
    schema.columns.every((col) => col.name && col.type);

  return (
    <div className="space-y-6">
      {/* Заголовок и вкладки */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Конструктор таблицы
            </h2>
            {schema.name && (
              <p className="text-sm text-gray-600 mt-1">
                Таблица:{" "}
                <span className="font-mono font-semibold">{schema.name}</span>
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!canGenerateSQL || isGenerating || isTesting}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Генерация...
                </>
              ) : (
                <>🚀 Сгенерировать SQL</>
              )}
            </Button>
            <Button
              variant="danger"
              onClick={handleTest}
              disabled={!canGenerateSQL || isTesting || isGenerating}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Тестирование...
                </>
              ) : (
                <>🧪 Протестировать</>
              )}
            </Button>
          </div>
        </div>

        {/* Статистика таблицы */}
        <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{schema.columns.length}</span>
            <span>Columns</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {getPrimaryKeyColumns().length}
            </span>
            <span>Primary Keys</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{schema.indexes.length}</span>
            <span>Indexes</span>
          </div>
          {schema.relationships && schema.relationships.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {schema.relationships.length}
              </span>
              <span>Relationships</span>
            </div>
          )}
        </div>

        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("structure")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "structure"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            🛠️ CREATE
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "data"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            📊 INSERT
          </button>
        </nav>
      </div>

      {/* Сообщение о необходимости заполнения */}
      {!canGenerateSQL && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-yellow-600 text-sm">!</span>
            </div>
            <div>
              <p className="text-yellow-800 text-sm">
                Для генерации SQL укажите название таблицы и добавьте хотя бы
                одну колонку с именем и типом.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Содержимое вкладок */}
      {activeTab === "structure" ? (
        <TableStructure
          schema={schema}
          onUpdate={updateSchema}
          onAddColumn={addColumn}
          onUpdateColumn={updateColumn}
          onRemoveColumn={removeColumn}
        />
      ) : (
        <TableData schema={schema} onUpdate={updateSchema} />
      )}

      {/* Кнопки действий внизу для мобильных устройств */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="flex gap-3">
          {onTest && (
            <Button
              variant="secondary"
              onClick={handleTest}
              disabled={!canGenerateSQL || isTesting || isGenerating}
              className="flex-1 flex items-center justify-center gap-2"
              size="sm"
            >
              {isTesting ? "..." : "🧪 Тест"}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!canGenerateSQL || isGenerating || isTesting}
            className="flex-1 flex items-center justify-center gap-2"
            size="sm"
          >
            {isGenerating ? "..." : "🚀 SQL"}
          </Button>
        </div>
      </div>
    </div>
  );
}
