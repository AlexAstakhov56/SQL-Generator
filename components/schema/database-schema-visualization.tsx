"use client";

import { DatabaseSchema, TableSchema } from "@/lib/types";
import { useState } from "react";
import { TableCard } from "../table-card";
import { TableDataModal } from "./table-data-modal";

interface DatabaseSchemaVisualizationProps {
  schema: DatabaseSchema;
}

export function DatabaseSchemaVisualization({
  schema,
}: DatabaseSchemaVisualizationProps) {
  const [selectedTable, setSelectedTable] = useState<TableSchema | null>(null);

  if (!schema.tables || schema.tables.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-medium text-gray-900 mb-4">
          🗃️ Визуализация схемы базы данных
        </h3>
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              />
            </svg>
          </div>
          <p className="text-gray-500">Нет таблиц для отображения</p>
          <p className="text-sm text-gray-400 mt-1">
            Добавьте таблицы чтобы увидеть схему
          </p>
        </div>
      </div>
    );
  }

  // Собираем все связи для отображения
  const allRelationships = schema.tables.flatMap(
    (table) => table.relationships
  );

  return (
    <>
      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium text-gray-900">
            🗃️ Визуализация схемы базы данных
          </h3>
          <div className="flex gap-2 text-md text-gray-500">
            <span>Таблиц: {schema.tables.length}</span>
            <span>•</span>
            <span>Связей: {allRelationships.length}</span>
            <span>•</span>
            <span>
              Колонок:{" "}
              {schema.tables.reduce(
                (acc, table) => acc + table.columns.length,
                0
              )}{" "}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="flex flex-wrap gap-4 mb-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span className="text-md text-gray-600">PK - Первичный ключ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-100 border border-blue-300 rounded"></div>
              <span className="text-md text-gray-600">FK - Внешний ключ</span>
            </div>
            {/* <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-xs text-gray-600">UNIQUE - Уникальный</span>
            </div> */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-purple-100 border border-purple-300 rounded"></div>
              <span className="text-md text-gray-600">AI - Auto Increment</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {schema.tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                allTables={schema.tables}
                relationships={allRelationships}
                onTableClick={setSelectedTable}
              />
            ))}
          </div>

          {allRelationships.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-md font-medium text-gray-700 mb-3">
                Связи между таблицами:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {allRelationships.map((relationship) => {
                  const sourceTable = schema.tables.find(
                    (t) => t.id === relationship.sourceTableId
                  );
                  const targetTable = schema.tables.find(
                    (t) => t.id === relationship.targetTableId
                  );
                  const sourceColumn = sourceTable?.columns.find(
                    (c) => c.id === relationship.sourceColumnId
                  );
                  const targetColumn = targetTable?.columns.find(
                    (c) => c.id === relationship.targetColumnId
                  );

                  if (
                    !sourceTable ||
                    !targetTable ||
                    !sourceColumn ||
                    !targetColumn
                  )
                    return null;

                  return (
                    <div
                      key={relationship.id}
                      className="bg-white p-2 rounded border text-gray-600"
                    >
                      <span className="font-medium">
                        {sourceTable.name}.{sourceColumn.name}
                      </span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">
                        {targetTable.name}.{targetColumn.name}
                      </span>
                      <span className="text-gray-400 ml-2">
                        (
                        {relationship.type === "ONE_TO_ONE"
                          ? "1:1"
                          : relationship.type === "ONE_TO_MANY"
                          ? "1:N"
                          : "N:N"}
                        )
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedTable && (
        <TableDataModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </>
  );
}
