"use client";

import {
  IndexDefinition,
  ColumnDefinition,
  IndexType,
  MySqlIndexConfig,
  PostgreSqlIndexConfig,
} from "../../lib/types";

interface IndexEditorProps {
  indexes: IndexDefinition[];
  columns: ColumnDefinition[];
  onAddIndex: () => void;
  onUpdateIndex: (indexId: string, updates: Partial<IndexDefinition>) => void;
  onRemoveIndex: (indexId: string) => void;
}

// Типы для значений select
type MySqlIndexType = MySqlIndexConfig["indexType"] | "DEFAULT";
type PostgreSqlIndexMethod = PostgreSqlIndexConfig["method"] | "DEFAULT";

export function IndexEditor({
  indexes,
  columns,
  onAddIndex,
  onUpdateIndex,
  onRemoveIndex,
}: IndexEditorProps) {
  const toggleIndexColumn = (indexId: string, columnId: string) => {
    const index = indexes.find((idx) => idx.id === indexId);
    if (!index) return;

    const currentColumns = index.columns || [];
    const updatedColumns = currentColumns.includes(columnId)
      ? currentColumns.filter((id) => id !== columnId)
      : [...currentColumns, columnId];

    onUpdateIndex(indexId, { columns: updatedColumns });
  };

  // Функции для безопасного обновления типов
  const handleMySqlIndexTypeChange = (indexId: string, value: string) => {
    const mysqlIndexType: MySqlIndexType =
      value === "DEFAULT"
        ? undefined
        : (value as MySqlIndexConfig["indexType"]);

    onUpdateIndex(indexId, {
      dbSpecific: {
        ...indexes.find((idx) => idx.id === indexId)?.dbSpecific,
        mysql: {
          ...indexes.find((idx) => idx.id === indexId)?.dbSpecific?.mysql,
          indexType: mysqlIndexType,
        },
      },
    });
  };

  const handlePostgreSqlMethodChange = (indexId: string, value: string) => {
    const postgresMethod: PostgreSqlIndexMethod =
      value === "DEFAULT"
        ? undefined
        : (value as PostgreSqlIndexConfig["method"]);

    onUpdateIndex(indexId, {
      dbSpecific: {
        ...indexes.find((idx) => idx.id === indexId)?.dbSpecific,
        postgresql: {
          ...indexes.find((idx) => idx.id === indexId)?.dbSpecific?.postgresql,
          method: postgresMethod,
        },
      },
    });
  };

  // Получение текущих значений с fallback
  const getMySqlIndexTypeValue = (index: IndexDefinition): string => {
    return index.dbSpecific?.mysql?.indexType || "DEFAULT";
  };

  const getPostgreSqlMethodValue = (index: IndexDefinition): string => {
    return index.dbSpecific?.postgresql?.method || "DEFAULT";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Индексы таблицы</h3>
        <button
          onClick={onAddIndex}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          + Добавить индекс
        </button>
      </div>

      {indexes.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Нет индексов. Добавьте первый индекс.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {indexes.map((index) => (
            <div key={index.id} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Название индекса */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название индекса *
                    </label>
                    <input
                      type="text"
                      value={index.name}
                      onChange={(e) =>
                        onUpdateIndex(index.id, { name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="idx_table_column"
                    />
                  </div>

                  {/* Тип индекса */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тип индекса
                    </label>
                    <select
                      value={index.type}
                      onChange={(e) =>
                        onUpdateIndex(index.id, {
                          type: e.target.value as IndexType,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="BTREE">BTREE</option>
                      <option value="HASH">HASH</option>
                      <option value="FULLTEXT">FULLTEXT</option>
                      <option value="SPATIAL">SPATIAL</option>
                      <option value="RTREE">RTREE (SQLite)</option>
                    </select>
                  </div>

                  {/* Уникальность */}
                  <div className="flex items-center">
                    <label className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        checked={index.unique}
                        onChange={(e) =>
                          onUpdateIndex(index.id, { unique: e.target.checked })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Уникальный индекс
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveIndex(index.id)}
                  className="text-red-600 hover:text-red-700 text-sm ml-4"
                >
                  Удалить
                </button>
              </div>

              {/* Выбор колонок для индекса */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Колонки в индексе *
                </label>
                {columns.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Добавьте колонки в таблицу чтобы создать индекс
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {columns.map((column) => (
                      <label
                        key={column.id}
                        className="flex items-center bg-gray-50 px-3 py-2 rounded border"
                      >
                        <input
                          type="checkbox"
                          checked={index.columns.includes(column.id)}
                          onChange={() =>
                            toggleIndexColumn(index.id, column.id)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 font-medium">
                          {column.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({column.type})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Специфичные настройки для СУБД */}
              <div className="border-t pt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">
                  Специфичные настройки СУБД
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* MySQL специфичные настройки */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MySQL: Использование индекса
                    </label>
                    <select
                      value={getMySqlIndexTypeValue(index)}
                      onChange={(e) =>
                        handleMySqlIndexTypeChange(index.id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DEFAULT">По умолчанию</option>
                      <option value="USING BTREE">BTREE</option>
                      <option value="USING HASH">HASH</option>
                    </select>
                  </div>

                  {/* PostgreSQL специфичные настройки */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PostgreSQL: Метод индексирования
                    </label>
                    <select
                      value={getPostgreSqlMethodValue(index)}
                      onChange={(e) =>
                        handlePostgreSqlMethodChange(index.id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DEFAULT">По умолчанию</option>
                      <option value="btree">btree</option>
                      <option value="hash">hash</option>
                      <option value="gist">gist</option>
                      <option value="gin">gin</option>
                      <option value="spgist">spgist</option>
                      <option value="brin">brin</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Предпросмотр SQL */}
              {index.columns.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded border">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Предпросмотр SQL:
                  </div>
                  <code className="text-xs bg-white p-2 rounded block">
                    CREATE {index.unique ? "UNIQUE " : ""}INDEX {index.name} ON
                    table_name (
                    {index.columns
                      .map((colId) => {
                        const column = columns.find((c) => c.id === colId);
                        return column?.name;
                      })
                      .join(", ")}
                    );
                  </code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
