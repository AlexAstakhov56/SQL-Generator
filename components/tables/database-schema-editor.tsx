"use client";

import { useState } from "react";
import { DatabaseSchema, TableSchema } from "../../lib/types";
import { MultiTableUtils } from "../../lib/utils/multi-table-utils";
import { TableList } from "./table-list";
import { RelationshipBuilder } from "./relationship-builder";

interface DatabaseSchemaEditorProps {
  schema: DatabaseSchema;
  onSchemaChange: (schema: DatabaseSchema) => void;
  onGenerateSQL: (schema: DatabaseSchema) => void;
  onTestSQL?: (schema: DatabaseSchema) => void;
  isGenerating?: boolean;
  isTesting?: boolean;
}

export function DatabaseSchemaEditor({
  schema,
  onSchemaChange,
  onGenerateSQL,
}: DatabaseSchemaEditorProps) {
  const [activeTab, setActiveTab] = useState<"tables" | "relationships">(
    "tables"
  );

  const addTable = () => {
    const newTable: TableSchema = {
      id: `table_${Date.now()}`,
      name: `table_${schema.tables.length + 1}`,
      columns: [],
      indexes: [],
      relationships: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedSchema = MultiTableUtils.addTable(schema, newTable);
    onSchemaChange(updatedSchema);
  };

  const updateTable = (tableId: string, updates: Partial<TableSchema>) => {
    const updatedTables = schema.tables.map((table) =>
      table.id === tableId
        ? { ...table, ...updates, updatedAt: new Date() }
        : table
    );

    onSchemaChange({ ...schema, tables: updatedTables });
  };

  const deleteTable = (tableId: string) => {
    const updatedTables = schema.tables.filter((table) => table.id !== tableId);

    // Удаляем связи, связанные с этой таблицей
    const updatedTablesWithoutRelationships = updatedTables.map((table) => ({
      ...table,
      relationships: table.relationships.filter(
        (rel) => rel.sourceTableId !== tableId && rel.targetTableId !== tableId
      ),
    }));

    onSchemaChange({ ...schema, tables: updatedTablesWithoutRelationships });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            База данных: {schema.name || "Новая база данных"}
          </h2>
          <p className="text-gray-600">
            Таблицы: {schema.tables.length} | Связи:{" "}
            {schema.tables.reduce(
              (acc, table) => acc + table.relationships.length,
              0
            )}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={addTable}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            + Добавить таблицу
          </button>
          <button
            onClick={() => onGenerateSQL(schema)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            disabled={schema.tables.length === 0}
          >
            🚀 Сгенерировать SQL
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("tables")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "tables"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🏗️ Таблицы ({schema.tables.length})
          </button>
          <button
            onClick={() => setActiveTab("relationships")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "relationships"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            disabled={schema.tables.length < 2}
          >
            🔗 Связи (
            {schema.tables.reduce(
              (acc, table) => acc + table.relationships.length,
              0
            )}
            )
          </button>
        </nav>
      </div>

      {activeTab === "tables" ? (
        <TableList
          tables={schema.tables}
          onTableUpdate={updateTable}
          onTableDelete={deleteTable}
        />
      ) : (
        <RelationshipBuilder schema={schema} onSchemaChange={onSchemaChange} />
      )}
    </div>
  );
}
