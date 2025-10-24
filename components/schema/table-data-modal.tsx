"use client";

import { TableSchema } from "@/lib/types";
import { useEffect } from "react";
import { Button } from "../ui/button";

interface TableDataModalProps {
  table: TableSchema;
  onClose: () => void;
}

export function TableDataModal({ table, onClose }: TableDataModalProps) {
  const data = table.data || [];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Данные таблицы: {table.name}
            </h2>
            <p className="text-lg text-gray-600 mt-1">
              Колонок: {table.columns.length}, Строк: {data.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer text-4xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
          {data.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-400 mb-3">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">
                Нет данных для отображения
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Добавьте данные в таблицу чтобы увидеть их здесь
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    {table.columns.map((column) => (
                      <th
                        key={column.id}
                        className="px-4 py-3 text-left text-md font-medium text-gray-700 uppercase tracking-wider"
                      >
                        <div className="flex items-center gap-2">
                          <span>{column.name}</span>
                          {column.constraints.includes("PRIMARY_KEY") && (
                            <span className="text-sm bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                              PK
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {column.type}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-md text-gray-500 font-medium">
                        {rowIndex + 1}
                      </td>
                      {table.columns.map((column) => (
                        <td
                          key={column.id}
                          className="px-4 py-3 text-md text-gray-900"
                        >
                          <div className="max-w-xs truncate">
                            {formatCellValue(row[column.name], column.type)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <div className="text-md text-gray-600">
            Показано строк: {data.length}
          </div>
          <Button onClick={onClose} variant="primary">
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatCellValue(value: any, columnType: string): string {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 19).replace("T", " ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return value.toString();
}
