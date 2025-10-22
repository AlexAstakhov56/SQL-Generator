// components/visualization/database-schema-visualization.tsx
"use client";

import { useState } from "react";
import {
  DatabaseSchema,
  TableSchema,
  ColumnDefinition,
  Relationship,
} from "../lib/types";
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">
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
          <h3 className="text-lg font-medium text-gray-900">
            🗃️ Визуализация схемы базы данных
          </h3>
          <div className="flex gap-2 text-sm text-gray-500">
            <span>{schema.tables.length} таблиц</span>
            <span>•</span>
            <span>{allRelationships.length} связей</span>
            <span>•</span>
            <span>
              {schema.tables.reduce(
                (acc, table) => acc + table.columns.length,
                0
              )}{" "}
              колонок
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border">
          {/* Легенда */}
          <div className="flex flex-wrap gap-4 mb-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span className="text-xs text-gray-600">PK - Первичный ключ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
              <span className="text-xs text-gray-600">FK - Внешний ключ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-xs text-gray-600">UNIQUE - Уникальный</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
              <span className="text-xs text-gray-600">AI - Auto Increment</span>
            </div>
          </div>

          {/* Таблицы */}
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

          {/* Информация о связях */}
          {allRelationships.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Связи между таблицами:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
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

      {/* Модальное окно с данными таблицы */}
      {selectedTable && (
        <TableDataModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </>
  );
}

// Компонент для отображения отдельной таблицы
interface TableCardProps {
  table: TableSchema;
  allTables: TableSchema[];
  relationships: Relationship[];
  onTableClick: (table: TableSchema) => void;
}

function TableCard({
  table,
  allTables,
  relationships,
  onTableClick,
}: TableCardProps) {
  // Находим связи для этой таблицы
  const tableRelationships = relationships.filter(
    (rel) => rel.sourceTableId === table.id || rel.targetTableId === table.id
  );

  return (
    <div
      className="bg-white border rounded-lg p-3 min-w-[250px] shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onTableClick(table)}
    >
      {/* Заголовок таблицы */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">{table.name}</h4>
          {table.comment && (
            <p className="text-xs text-gray-500 mt-1">{table.comment}</p>
          )}
        </div>
        <div className="flex gap-1">
          {tableRelationships.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {tableRelationships.length} связей
            </span>
          )}
        </div>
      </div>

      {/* Колонки таблицы */}
      <div className="space-y-1.5">
        {table.columns.map((column) => (
          <ColumnRow
            key={column.id}
            column={column}
            table={table}
            allTables={allTables}
            relationships={relationships}
          />
        ))}
      </div>

      {/* Информация о данных */}
      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{table.data?.length || 0} строк данных</span>
          <span className="text-blue-600 hover:text-blue-800">
            Просмотреть данные →
          </span>
        </div>
      </div>
    </div>
  );
}

// Компонент для отображения колонки (остается без изменений)
interface ColumnRowProps {
  column: ColumnDefinition;
  table: TableSchema;
  allTables: TableSchema[];
  relationships: Relationship[];
}

function ColumnRow({
  column,
  table,
  allTables,
  relationships,
}: ColumnRowProps) {
  // Проверяем, является ли колонка внешним ключом
  const isForeignKey = relationships.some(
    (rel) => rel.sourceTableId === table.id && rel.sourceColumnId === column.id
  );

  // Находим целевую таблицу для FK
  const foreignKeyRelation = relationships.find(
    (rel) => rel.sourceTableId === table.id && rel.sourceColumnId === column.id
  );
  const targetTable = foreignKeyRelation
    ? allTables.find((t) => t.id === foreignKeyRelation.targetTableId)
    : null;

  return (
    <div className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-sm">
      <div className="flex items-center gap-2 flex-1">
        {/* Иконки constraints */}
        <div className="flex gap-1">
          {column.constraints.includes("PRIMARY_KEY") && (
            <span
              className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200"
              title="Primary Key"
            >
              PK
            </span>
          )}
          {isForeignKey && (
            <span
              className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200"
              title="Foreign Key"
            >
              FK
            </span>
          )}
          {column.constraints.includes("AUTO_INCREMENT") && (
            <span
              className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200"
              title="Auto Increment"
            >
              AI
            </span>
          )}
        </div>

        {/* Имя колонки */}
        <span
          className={`font-mono text-xs ${
            column.constraints.includes("PRIMARY_KEY")
              ? "font-bold text-gray-900"
              : "text-gray-700"
          }`}
        >
          {column.name}
        </span>
      </div>

      {/* Тип и дополнительная информация */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">
          {getShortType(column.type)}
        </span>

        {/* Информация о внешнем ключе */}
        {isForeignKey && targetTable && (
          <span
            className="text-xs text-blue-600"
            title={`References ${targetTable.name}`}
          >
            → {targetTable.name}
          </span>
        )}

        {(column.constraints?.includes("NOT_NULL") ||
          column.nullable === false) &&
          !column.constraints?.includes("PRIMARY_KEY") && (
            <span className="text-xs text-red-500" title="Not Null">
              NN
            </span>
          )}
      </div>
    </div>
  );
}

// Вспомогательная функция для сокращения типов данных
function getShortType(type: string): string {
  const typeMap: Record<string, string> = {
    INTEGER: "INT",
    BIGINT: "BIGINT",
    SMALLINT: "SMALLINT",
    VARCHAR: "VARCHAR",
    TEXT: "TEXT",
    CHAR: "CHAR",
    BOOLEAN: "BOOL",
    DATE: "DATE",
    DATETIME: "DATETIME",
    TIMESTAMP: "TS",
    DECIMAL: "DEC",
    FLOAT: "FLOAT",
    BLOB: "BLOB",
    JSON: "JSON",
  };
  return typeMap[type] || type;
}
