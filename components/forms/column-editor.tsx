"use client";

import { ColumnDefinition } from "../../lib/types";
import { constraintUtils } from "../../lib/utils/constraint-utils";
import { Button } from "../ui/button";

interface ColumnEditorProps {
  columns: ColumnDefinition[];
  onAddColumn: () => void;
  onUpdateColumn: (
    columnId: string,
    updates: Partial<ColumnDefinition>
  ) => void;
  onRemoveColumn: (columnId: string) => void;
  onMoveColumn: (columnId: string, direction: "up" | "down") => void;
}

export function ColumnEditor({
  columns,
  onAddColumn,
  onUpdateColumn,
  onRemoveColumn,
}: ColumnEditorProps) {
  const handleConstraintChange = (
    columnId: string,
    constraint: string,
    enabled: boolean
  ) => {
    const column = columns.find((col) => col.id === columnId);
    if (!column) return;

    if (constraint === "NOT_NULL") {
      let updatedConstraints = [...(column.constraints || [])];

      if (enabled) {
        if (!updatedConstraints.includes("NOT_NULL")) {
          updatedConstraints.push("NOT_NULL");
        }
        onUpdateColumn(columnId, {
          constraints: updatedConstraints,
          nullable: false,
        });
      } else {
        updatedConstraints = updatedConstraints.filter((c) => c !== "NOT_NULL");
        onUpdateColumn(columnId, {
          constraints: updatedConstraints,
          nullable: true,
        });
      }
    } else {
      if (enabled) {
        onUpdateColumn(
          columnId,
          constraintUtils.addConstraint(column, constraint as any)
        );
      } else {
        onUpdateColumn(
          columnId,
          constraintUtils.removeConstraint(column, constraint as any)
        );
      }
    }
  };

  const hasConstraint = (
    column: ColumnDefinition,
    constraint: string
  ): boolean => {
    if (constraint === "NOT_NULL") {
      return (
        !column.nullable ||
        (column.constraints && column.constraints.includes("NOT_NULL"))
      );
    }
    return constraintUtils.hasConstraint(column, constraint as any);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Колонки таблицы</h3>
        <Button onClick={onAddColumn} variant="warning">
          + Добавить колонку
        </Button>
      </div>

      {columns.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Нет колонок. Добавьте первую колонку.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {columns.map((column, index) => (
            <div
              key={column.id}
              className="border rounded-lg p-4 space-y-3 bg-white"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900 text-xl">
                  Колонка #{index + 1}
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => onRemoveColumn(column.id)}
                    className="text-red-500 transition duration-200 cursor-pointer hover:text-red-600 text-md"
                  >
                    Удалить
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-1">
                    Имя колонки <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={column.name}
                    onChange={(e) =>
                      onUpdateColumn(column.id, { name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-lg border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-1">
                    Тип данных <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={column.type}
                    onChange={(e) =>
                      onUpdateColumn(column.id, { type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-lg border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INTEGER">INTEGER</option>
                    <option value="VARCHAR">VARCHAR</option>
                    <option value="TEXT">TEXT</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="DATE">DATE</option>
                    <option value="TIMESTAMP">TIMESTAMP</option>
                    <option value="DECIMAL">DECIMAL</option>
                    <option value="FLOAT">FLOAT</option>
                    <option value="BLOB">BLOB</option>
                  </select>
                </div>

                {column.type === "VARCHAR" && (
                  <div>
                    <label className="block text-md font-semibold text-gray-700 mb-1">
                      Длина
                    </label>
                    <input
                      type="number"
                      value={column.length || 255}
                      onChange={(e) =>
                        onUpdateColumn(column.id, {
                          length: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-lg border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="65535"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-1">
                    Значение по умолчанию
                  </label>
                  <input
                    type="text"
                    value={column.defaultValue || ""}
                    onChange={(e) =>
                      onUpdateColumn(column.id, {
                        defaultValue: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border text-lg border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="NULL"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={hasConstraint(column, "PRIMARY_KEY")}
                    onChange={(e) => {
                      handleConstraintChange(
                        column.id,
                        "PRIMARY_KEY",
                        e.target.checked
                      );
                    }}
                    className="accent-green-600 w-5 h-5 cursor-pointer transition duration-200"
                  />
                  <span className="ml-2 text-md text-gray-700">
                    Primary Key
                  </span>
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
                    className="accent-green-600 w-5 h-5 cursor-pointer transition duration-200"
                  />
                  <span className="ml-2 text-md text-gray-700">Not Null</span>
                </label>

                {/* <label className="flex items-center">
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
                  <span className="ml-2 text-sm text-gray-700">Unique</span>
                </label> */}

                {hasConstraint(column, "PRIMARY_KEY") && (
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
                      className="accent-green-600 w-5 h-5 cursor-pointer transition duration-200"
                    />
                    <span className="ml-2 text-md text-gray-700">
                      Auto Increment
                    </span>
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
