// components/forms/data-editor.tsx
"use client";

import { useState, useEffect } from "react";
import { TableSchema, ColumnDefinition } from "../../lib/types";
import { DataCell } from "./data-cell";
import { Button } from "../ui/button";

interface DataEditorProps {
  table: TableSchema;
  onDataChange: (data: Record<string, any>[]) => void;
}

interface ValidationError {
  rowIndex: number;
  columnName: string;
  message: string;
}

export function DataEditor({ table, onDataChange }: DataEditorProps) {
  const [tableData, setTableData] = useState<Record<string, any>[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  // Находим AUTO_INCREMENT PRIMARY KEY колонку
  const autoIncrementPkColumn = table.columns.find(
    (column) =>
      column.constraints?.includes("PRIMARY_KEY") &&
      column.constraints?.includes("AUTO_INCREMENT")
  );

  useEffect(() => {
    if (table.data && table.data.length > 0) {
      setTableData(table.data);
    }
  }, [table.data]);

  useEffect(() => {
    validateAllData();
  }, [tableData]);

  // Валидация всех данных
  const validateAllData = (): boolean => {
    const errors: ValidationError[] = [];

    tableData.forEach((row, rowIndex) => {
      table.columns.forEach((column) => {
        // Пропускаем AUTO_INCREMENT поля
        if (
          column.constraints?.includes("PRIMARY_KEY") &&
          column.constraints?.includes("AUTO_INCREMENT")
        ) {
          return;
        }

        // Проверка NOT NULL constraint
        if (
          column.constraints?.includes("NOT_NULL") &&
          (row[column.name] === "" ||
            row[column.name] === null ||
            row[column.name] === undefined)
        ) {
          errors.push({
            rowIndex,
            columnName: column.name,
            message: `Поле "${column.name}" не может быть пустым`,
          });
        }
      });
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const isCellValid = (rowIndex: number, columnName: string): boolean => {
    return !validationErrors.some(
      (error) => error.rowIndex === rowIndex && error.columnName === columnName
    );
  };

  const getCellError = (
    rowIndex: number,
    columnName: string
  ): string | null => {
    const error = validationErrors.find(
      (error) => error.rowIndex === rowIndex && error.columnName === columnName
    );
    return error ? error.message : null;
  };

  function createEmptyRow(
    columns: ColumnDefinition[],
    nextId: number
  ): Record<string, any> {
    const row: Record<string, any> = {};

    columns.forEach((column) => {
      // Для AUTO_INCREMENT PRIMARY KEY - генерируем ID
      if (
        column.constraints?.includes("PRIMARY_KEY") &&
        column.constraints?.includes("AUTO_INCREMENT")
      ) {
        row[column.name] = nextId;
        return;
      }

      // Для NOT NULL полей устанавливаем значения по умолчанию
      if (column.constraints?.includes("NOT_NULL")) {
        switch (column.type) {
          case "INTEGER":
          case "BIGINT":
          case "SMALLINT":
            row[column.name] = column.defaultValue || 0;
            break;
          case "BOOLEAN":
            row[column.name] = column.defaultValue === "TRUE" ? true : false;
            break;
          case "DATE":
            row[column.name] =
              column.defaultValue || new Date().toISOString().split("T")[0];
            break;
          case "TIMESTAMP":
          case "DATETIME":
            row[column.name] =
              column.defaultValue ||
              new Date().toISOString().slice(0, 19).replace("T", " ");
            break;
          default:
            row[column.name] = column.defaultValue || "default_value";
        }
      } else {
        // Для nullable полей
        switch (column.type) {
          case "INTEGER":
          case "BIGINT":
          case "SMALLINT":
            row[column.name] = column.defaultValue || "";
            break;
          case "BOOLEAN":
            row[column.name] = column.defaultValue === "TRUE" ? true : false;
            break;
          case "DATE":
            row[column.name] =
              column.defaultValue || new Date().toISOString().split("T")[0];
            break;
          case "TIMESTAMP":
          case "DATETIME":
            row[column.name] =
              column.defaultValue ||
              new Date().toISOString().slice(0, 19).replace("T", " ");
            break;
          default:
            row[column.name] = column.defaultValue || "";
        }
      }
    });
    return row;
  }

  const getNextAutoIncrementId = (): number => {
    if (!autoIncrementPkColumn) return 1;

    const existingIds = tableData
      .map((row) => row[autoIncrementPkColumn.name])
      .filter((id) => id !== null && id !== undefined && id !== "")
      .map((id) => Number(id))
      .filter((id) => !isNaN(id));

    return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  };

  const addRow = () => {
    const nextId = getNextAutoIncrementId();
    const newData = [...tableData, createEmptyRow(table.columns, nextId)];
    setTableData(newData);
    onDataChange(newData);
  };

  const removeRow = (index: number) => {
    const newData = tableData.filter((_, i) => i !== index);
    setTableData(newData);
    onDataChange(newData);
  };

  const updateCell = (rowIndex: number, columnName: string, value: any) => {
    // Запрещаем редактирование AUTO_INCREMENT PRIMARY KEY
    const column = table.columns.find((c) => c.name === columnName);
    if (
      column?.constraints?.includes("PRIMARY_KEY") &&
      column?.constraints?.includes("AUTO_INCREMENT")
    ) {
      return;
    }

    const newData = tableData.map((row, index) => {
      if (index === rowIndex) {
        return { ...row, [columnName]: value };
      }
      return row;
    });
    setTableData(newData);
    onDataChange(newData);
  };

  const generateInsertSQL = (): string => {
    if (tableData.length === 0) return "";

    // Фильтруем только валидные строки
    const validData = tableData.filter((row, rowIndex) => {
      const rowErrors = validationErrors.filter(
        (error) => error.rowIndex === rowIndex
      );
      return rowErrors.length === 0;
    });

    if (validData.length === 0) return "";

    // Исключаем AUTO_INCREMENT поля из INSERT (они генерируются автоматически)
    const insertColumns = table.columns
      .filter(
        (column) =>
          !(
            column.constraints?.includes("PRIMARY_KEY") &&
            column.constraints?.includes("AUTO_INCREMENT")
          )
      )
      .map((column) => column.name);

    const values = validData
      .map(
        (row) =>
          `(${insertColumns
            .map((col) =>
              formatValueForSQL(
                row[col],
                table.columns.find((c) => c.name === col)?.type
              )
            )
            .join(", ")})`
      )
      .join(",\n");

    return `INSERT INTO ${table.name} (${insertColumns.join(
      ", "
    )})\nVALUES ${values};`;
  };

  const formatValueForSQL = (value: any, columnType?: string): string => {
    if (value === null || value === undefined || value === "") {
      return "NULL";
    }

    if (typeof value === "boolean") {
      return value ? "TRUE" : "FALSE";
    }

    if (value instanceof Date) {
      return `'${value.toISOString().slice(0, 19).replace("T", " ")}'`;
    }

    // Для строковых типов добавляем кавычки
    if (
      typeof value === "string" ||
      (columnType &&
        ["VARCHAR", "TEXT", "CHAR", "DATE", "TIMESTAMP", "DATETIME"].includes(
          columnType
        ))
    ) {
      return `'${value.toString().replace(/'/g, "''")}'`;
    }

    return value.toString();
  };

  const insertSQL = generateInsertSQL();
  const isValid = validationErrors.length === 0 && tableData.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-medium text-gray-900">
            Данные для вставки
          </h3>
          <p className="text-md text-gray-600">
            Добавьте тестовые данные для генерации INSERT запросов
            {autoIncrementPkColumn && (
              <span className="text-blue-600 ml-2">
                (ID генерируются автоматически)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {validationErrors.length > 0 && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
              {validationErrors.length} ошибок валидации
            </div>
          )}
          <Button onClick={addRow} variant="success">
            + Добавить строку
          </Button>
        </div>
      </div>

      {tableData.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Нет данных для отображения</p>
          <button
            onClick={addRow}
            className="mt-2 text-blue-500 hover:text-blue-700"
          >
            Добавить первую строку
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 border-b text-left text-md font-medium text-gray-700">
                  #
                </th>
                {table.columns.map((column) => (
                  <th
                    key={column.id}
                    className="px-5 py-2 border-b text-left text-md font-medium text-gray-700"
                  >
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        {column.name}
                        {column.constraints?.includes("PRIMARY_KEY") && (
                          <span className="text-sm bg-yellow-100 text-yellow-800 px-1 rounded">
                            PK
                          </span>
                        )}
                        {column.constraints?.includes("AUTO_INCREMENT") && (
                          <span className="text-sm bg-blue-100 text-blue-800 px-1 rounded">
                            AI
                          </span>
                        )}
                        {column.constraints?.includes("NOT_NULL") && (
                          <span className="text-sm bg-red-100 text-red-800 px-1 rounded">
                            NN
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{column.type}</div>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-700">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`hover:bg-gray-50 ${
                    validationErrors.some(
                      (error) => error.rowIndex === rowIndex
                    )
                      ? "bg-red-50"
                      : ""
                  }`}
                >
                  <td className="px-4 py-2 border-b text-sm text-gray-500">
                    {rowIndex + 1}
                  </td>
                  {table.columns.map((column) => {
                    const isAutoIncrementPk =
                      column.constraints?.includes("PRIMARY_KEY") &&
                      column.constraints?.includes("AUTO_INCREMENT");
                    const isNotNull = column.constraints?.includes("NOT_NULL");
                    const isValid = isCellValid(rowIndex, column.name);
                    const errorMessage = getCellError(rowIndex, column.name);

                    return (
                      <td key={column.id} className="px-4 py-2 border-b">
                        <DataCell
                          value={row[column.name]}
                          column={column}
                          onChange={(value) =>
                            updateCell(rowIndex, column.name, value)
                          }
                          disabled={isAutoIncrementPk}
                          isValid={isValid}
                          errorMessage={errorMessage}
                        />
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 border-b">
                    <button
                      onClick={() => removeRow(rowIndex)}
                      className="text-red-500 hover:text-red-600 cursor-pointer text-md"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isValid && insertSQL && (
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-medium text-gray-300">
              INSERT запросы
            </h4>
            <button
              onClick={() => navigator.clipboard.writeText(insertSQL)}
              className="text-md cursor-pointer text-gray-400 hover:text-white bg-gray-800 px-2 py-1 rounded"
            >
              📋 Копировать
            </button>
          </div>
          <pre className="text-green-400 font-mono text-md whitespace-pre-wrap overflow-x-auto">
            {insertSQL}
          </pre>
          <div className="text-sm text-gray-500 mt-2">
            Сгенерировано запросов: {tableData.length}
            {autoIncrementPkColumn && " (AUTO_INCREMENT поля исключены)"}
          </div>
        </div>
      )}
    </div>
  );
}
