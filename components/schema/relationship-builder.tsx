"use client";

import { useState } from "react";
import {
  DatabaseSchema,
  TableSchema,
  ColumnDefinition,
  Relationship,
} from "../../lib/types";
import { MultiTableUtils } from "../../lib/utils/multi-table-utils";

interface RelationshipBuilderProps {
  schema: DatabaseSchema;
  onSchemaChange: (schema: DatabaseSchema) => void;
}

export function RelationshipBuilder({
  schema,
  onSchemaChange,
}: RelationshipBuilderProps) {
  const [newRelationship, setNewRelationship] = useState<Partial<Relationship>>(
    {
      type: "ONE_TO_MANY",
      onDelete: "RESTRICT",
      onUpdate: "RESTRICT",
    }
  );

  const handleCreateRelationship = () => {
    if (
      !newRelationship.sourceTableId ||
      !newRelationship.sourceColumnId ||
      !newRelationship.targetTableId ||
      !newRelationship.targetColumnId
    ) {
      alert("Заполните все поля для создания связи");
      return;
    }

    const existingRelationships = getAllRelationships();
    const relationshipExists = existingRelationships.some(
      (rel) =>
        rel.sourceTableId === newRelationship.sourceTableId &&
        rel.sourceColumnId === newRelationship.sourceColumnId &&
        rel.targetTableId === newRelationship.targetTableId &&
        rel.targetColumnId === newRelationship.targetColumnId
    );

    if (relationshipExists) {
      alert("Такая связь уже существует!");
      return;
    }

    const relationship: Relationship = {
      id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Уникальный ID
      name: newRelationship.name || `fk_${Date.now()}`,
      sourceTableId: newRelationship.sourceTableId!,
      sourceColumnId: newRelationship.sourceColumnId!,
      targetTableId: newRelationship.targetTableId!,
      targetColumnId: newRelationship.targetColumnId!,
      type: newRelationship.type!,
      onDelete: newRelationship.onDelete!,
      onUpdate: newRelationship.onUpdate!,
    };

    // Добавляем связь ТОЛЬКО в исходную таблицу
    const updatedTables = schema.tables.map((table) => {
      if (table.id === relationship.sourceTableId) {
        return {
          ...table,
          relationships: [...table.relationships, relationship],
          updatedAt: new Date(),
        };
      }
      return table;
    });

    onSchemaChange({
      ...schema,
      tables: updatedTables,
    });

    // Сброс формы
    setNewRelationship({
      type: "ONE_TO_MANY",
      onDelete: "RESTRICT",
      onUpdate: "RESTRICT",
    });
  };

  const handleDeleteRelationship = (relationshipId: string) => {
    const updatedTables = schema.tables.map((table) => ({
      ...table,
      relationships: table.relationships.filter(
        (rel) => rel.id !== relationshipId
      ),
    }));

    onSchemaChange({
      ...schema,
      tables: updatedTables,
    });
  };

  // Получение таблицы по ID
  const getTableById = (tableId: string): TableSchema | undefined => {
    return schema.tables.find((table) => table.id === tableId);
  };

  // Получение колонки по ID
  const getColumnById = (
    tableId: string,
    columnId: string
  ): ColumnDefinition | undefined => {
    const table = getTableById(tableId);
    return table?.columns.find((col) => col.id === columnId);
  };

  // Получение всех связей из всех таблиц
  const getAllRelationships = (): Relationship[] => {
    return schema.tables.flatMap((table) => table.relationships);
  };

  const relationships = getAllRelationships();

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-medium text-gray-900 mb-4">
          Создать новую связь
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              Исходная таблица (с Foreign Key){" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              value={newRelationship.sourceTableId || ""}
              onChange={(e) =>
                setNewRelationship((prev) => ({
                  ...prev,
                  sourceTableId: e.target.value,
                  sourceColumnId: "", // Сбрасываем выбор колонки
                }))
              }
              className="w-full text-lg px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите таблицу</option>
              {schema.tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              Исходная колонка <span className="text-red-500">*</span>
            </label>
            <select
              value={newRelationship.sourceColumnId || ""}
              onChange={(e) =>
                setNewRelationship((prev) => ({
                  ...prev,
                  sourceColumnId: e.target.value,
                }))
              }
              disabled={!newRelationship.sourceTableId}
              className="w-full px-3 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Выберите колонку</option>
              {newRelationship.sourceTableId &&
                getTableById(newRelationship.sourceTableId)?.columns.map(
                  (column) => (
                    <option key={column.id} value={column.id}>
                      {column.name} ({column.type})
                    </option>
                  )
                )}
            </select>
          </div>

          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              Целевая таблица (с Primary Key){" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              value={newRelationship.targetTableId || ""}
              onChange={(e) =>
                setNewRelationship((prev) => ({
                  ...prev,
                  targetTableId: e.target.value,
                  targetColumnId: "", // Сбрасываем выбор колонки
                }))
              }
              className="w-full px-3 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите таблицу</option>
              {schema.tables
                .filter((table) => table.id !== newRelationship.sourceTableId) // Исключаем исходную таблицу
                .map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              Целевая колонка <span className="text-red-500">*</span>
            </label>
            <select
              value={newRelationship.targetColumnId || ""}
              onChange={(e) =>
                setNewRelationship((prev) => ({
                  ...prev,
                  targetColumnId: e.target.value,
                }))
              }
              disabled={!newRelationship.targetTableId}
              className="w-full px-3 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Выберите колонку</option>
              {newRelationship.targetTableId &&
                getTableById(newRelationship.targetTableId)?.columns.map(
                  (column) => (
                    <option key={column.id} value={column.id}>
                      {column.name} ({column.type})
                    </option>
                  )
                )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              Название связи
            </label>
            <input
              type="text"
              value={newRelationship.name || ""}
              onChange={(e) =>
                setNewRelationship((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="fk_users_posts"
            />
          </div>

          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              Тип связи
            </label>
            <select
              value={newRelationship.type || "ONE_TO_MANY"}
              onChange={(e) =>
                setNewRelationship((prev) => ({
                  ...prev,
                  type: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ONE_TO_ONE">One-to-One</option>
              <option value="ONE_TO_MANY">One-to-Many</option>
              <option value="MANY_TO_MANY">Many-to-Many</option>
            </select>
          </div>

          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              ON DELETE
            </label>
            <select
              value={newRelationship.onDelete || "RESTRICT"}
              onChange={(e) =>
                setNewRelationship((prev) => ({
                  ...prev,
                  onDelete: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="RESTRICT">RESTRICT</option>
              <option value="CASCADE">CASCADE</option>
              <option value="SET NULL">SET NULL</option>
              <option value="NO ACTION">NO ACTION</option>
            </select>
          </div>

          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              ON UPDATE
            </label>
            <select
              value={newRelationship.onUpdate || "RESTRICT"}
              onChange={(e) =>
                setNewRelationship((prev) => ({
                  ...prev,
                  onUpdate: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="RESTRICT">RESTRICT</option>
              <option value="CASCADE">CASCADE</option>
              <option value="SET NULL">SET NULL</option>
              <option value="NO ACTION">NO ACTION</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleCreateRelationship}
          disabled={
            !newRelationship.sourceTableId ||
            !newRelationship.sourceColumnId ||
            !newRelationship.targetTableId ||
            !newRelationship.targetColumnId
          }
          className="bg-violet-500 cursor-pointer transition duration-200 text-white px-4 py-2 rounded-md hover:bg-violet-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Создать связь
        </button>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-medium text-gray-900 mb-4">
          Существующие связи ({relationships.length})
        </h3>

        {relationships.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              Нет созданных связей между таблицами
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {relationships.map((relationship) => {
              const sourceTable = getTableById(relationship.sourceTableId);
              const sourceColumn = getColumnById(
                relationship.sourceTableId,
                relationship.sourceColumnId
              );
              const targetTable = getTableById(relationship.targetTableId);
              const targetColumn = getColumnById(
                relationship.targetTableId,
                relationship.targetColumnId
              );

              return (
                <div
                  key={relationship.id}
                  className="border rounded-lg p-4 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="font-medium text-lg text-gray-900">
                        {relationship.name}
                      </span>
                      <span className="text-md bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {relationship.type === "ONE_TO_ONE"
                          ? "1:1"
                          : relationship.type === "ONE_TO_MANY"
                          ? "1:N"
                          : "N:N"}
                      </span>
                    </div>

                    <div className="text-md text-gray-600">
                      <span className="font-medium">
                        {sourceTable?.name}.{sourceColumn?.name}
                      </span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">
                        {targetTable?.name}.{targetColumn?.name}
                      </span>
                    </div>

                    <div className="text-md text-gray-500 mt-1">
                      ON DELETE: {relationship.onDelete} | ON UPDATE:{" "}
                      {relationship.onUpdate}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteRelationship(relationship.id)}
                    className="text-red-500 cursor-pointer hover:text-red-600 text-md ml-4"
                  >
                    Удалить
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
