"use client";

import { TableSchema, ColumnDefinition, Constraint } from "../../lib/types";
import { constraintUtils } from "../../lib/utils/constraint-utils";

interface TableStructureProps {
  schema: TableSchema;
  onUpdate: (updates: Partial<TableSchema>) => void;
  onAddColumn: () => void;
  onUpdateColumn: (
    columnId: string,
    updates: Partial<ColumnDefinition>
  ) => void;
  onRemoveColumn: (columnId: string) => void;
}

export function TableStructure({
  schema,
  onUpdate,
  onAddColumn,
  onUpdateColumn,
  onRemoveColumn,
}: TableStructureProps) {
  const handleConstraintChange = (
    columnId: string,
    constraint: Constraint,
    enabled: boolean
  ) => {
    const column = schema.columns.find((col) => col.id === columnId);
    if (!column) return;

    if (enabled) {
      onUpdateColumn(
        columnId,
        constraintUtils.addConstraint(column, constraint)
      );
    } else {
      onUpdateColumn(
        columnId,
        constraintUtils.removeConstraint(column, constraint)
      );
    }
  };

  const hasConstraint = (
    column: ColumnDefinition,
    constraint: Constraint
  ): boolean => {
    return constraintUtils.hasConstraint(column, constraint);
  };

  return (
    <div className="space-y-4">
      <div className="w-1/2 mx-auto">
        <div>
          <label className="block text-md font-semibold mb-1">
            Название таблицы <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={schema.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="users"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Колонки</h3>
          <button
            onClick={onAddColumn}
            className="bg-yellow-500 cursor-pointer transition duration-200 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
          >
            + Добавить колонку
          </button>
        </div>

        {schema.columns.map((column) => (
          <div
            key={column.id}
            className="border-2 rounded-lg p-4 space-y-3 bg-violet-300"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 ">
              <div>
                <label className="block text-md font-semibold mb-1">
                  Имя колонки <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={column.name}
                  onChange={(e) =>
                    onUpdateColumn(column.id, { name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-md font-semibold mb-1">
                  Тип <span className="text-red-600">*</span>
                </label>
                <select
                  value={column.type}
                  onChange={(e) =>
                    onUpdateColumn(column.id, { type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="INTEGER">INTEGER</option>
                  <option value="VARCHAR">VARCHAR</option>
                  <option value="TEXT">TEXT</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                  <option value="DATE">DATE</option>
                  <option value="TIMESTAMP">TIMESTAMP</option>
                  <option value="DECIMAL">DECIMAL</option>
                </select>
              </div>

              <div>
                <label className="block text-md font-semibold mb-1">
                  Обязательное поле
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={hasConstraint(column, "NOT_NULL")}
                    onChange={(e) =>
                      handleConstraintChange(
                        column.id,
                        "NOT_NULL",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-semibold">NOT NULL</span>
                </label>
              </div>

              {/* Default Value */}
              <div>
                <label className="block text-md font-semibold mb-1">
                  Значение по умолчанию
                </label>
                <input
                  type="text"
                  value={column.defaultValue || ""}
                  onChange={(e) =>
                    onUpdateColumn(column.id, { defaultValue: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="NULL"
                />
              </div>
            </div>

            {/* Constraints */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={hasConstraint(column, "PRIMARY_KEY")}
                  onChange={(e) =>
                    handleConstraintChange(
                      column.id,
                      "PRIMARY_KEY",
                      e.target.checked
                    )
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-md font-semibold">Primary Key</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={hasConstraint(column, "UNIQUE")}
                  onChange={(e) =>
                    handleConstraintChange(
                      column.id,
                      "UNIQUE",
                      e.target.checked
                    )
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-md font-semibold">Unique</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={hasConstraint(column, "AUTO_INCREMENT")}
                  onChange={(e) =>
                    handleConstraintChange(
                      column.id,
                      "AUTO_INCREMENT",
                      e.target.checked
                    )
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-md font-semibold">
                  Auto Increment
                </span>
              </label>
            </div>

            {/* Remove button */}
            <div className="flex justify-end">
              <button
                onClick={() => onRemoveColumn(column.id)}
                className="text-red-500 font-bold hover:text-red-700 cursor-pointer text-sm"
              >
                Удалить колонку
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
