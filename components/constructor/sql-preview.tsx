// components/constructor/sql-preview.tsx
"use client";

import { DatabaseType, GeneratedSQL } from "../../lib/types";

interface SQLPreviewProps {
  sql: string | Partial<Record<DatabaseType, GeneratedSQL>>;
  selectedDB: DatabaseType;
}

export const SQLPreview: React.FC<SQLPreviewProps> = ({ sql, selectedDB }) => {
  // Функция для безопасного извлечения SQL строки
  const getSQLString = (): string => {
    if (typeof sql === "string") {
      return sql;
    }

    // Если это объект с SQL по СУБД
    const dbSQL = sql[selectedDB];
    if (dbSQL && typeof dbSQL === "object" && "sql" in dbSQL) {
      return dbSQL.sql;
    }

    // Если это просто строка в объекте
    if (dbSQL && typeof dbSQL === "string") {
      return dbSQL;
    }

    return "";
  };

  const sqlString = getSQLString();
  const lineCount = sqlString ? sqlString.split("\n").length : 0;

  return (
    <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-700">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-300 bg-gray-800 px-2 py-1 rounded">
            {selectedDB.toUpperCase()}
          </span>
          {sqlString && (
            <span className="text-xs text-gray-500">{lineCount} lines</span>
          )}
        </div>
        {sqlString && (
          <button
            onClick={() => navigator.clipboard.writeText(sqlString)}
            className="text-xs cursor-pointer text-gray-400 hover:text-white bg-gray-800 px-3 py-1 rounded transition-colors"
          >
            📋 Копировать
          </button>
        )}
      </div>
      <div className="p-4">
        <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
          {sqlString || "// SQL будет сгенерирован здесь"}
        </pre>
      </div>
    </div>
  );
};
