import { TableSchema, ColumnDefinition, DataType } from "../../lib/types";
import { createDefaultColumn } from "../../lib/utils/schema-utils";
import { DATA_TYPES } from "../../lib/constants/db-types";

interface TableBuilderProps {
  schema: TableSchema;
  onChange: (schema: TableSchema) => void;
}

export function TableBuilder({ schema, onChange }: TableBuilderProps) {
  const updateSchema = (updates: Partial<TableSchema>) => {
    onChange({
      ...schema,
      ...updates,
      updatedAt: new Date(),
    });
  };

  const addColumn = () => {
    const newColumn = createDefaultColumn();
    updateSchema({
      columns: [...schema.columns, newColumn],
    });
  };

  const updateColumn = (
    columnId: string,
    updates: Partial<ColumnDefinition>
  ) => {
    const updatedColumns = schema.columns.map((column) =>
      column.id === columnId ? { ...column, ...updates } : column
    );
    updateSchema({ columns: updatedColumns });
  };

  const removeColumn = (columnId: string) => {
    const updatedColumns = schema.columns.filter(
      (column) => column.id !== columnId
    );
    updateSchema({ columns: updatedColumns });
  };

  const updateTableName = (name: string) => {
    updateSchema({ name });
  };

  return (
    <div className="space-y-6">
      {/* Заголовок таблицы */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Название таблицы
        </label>
        <input
          type="text"
          value={schema.name}
          onChange={(e) => updateTableName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="users"
        />
      </div>

      {/* Колонки */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Колонки</h3>
          <button
            onClick={addColumn}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            + Добавить колонку
          </button>
        </div>

        <div className="space-y-3">
          {schema.columns.map((column, index) => (
            <ColumnEditor
              key={column.id}
              column={column}
              index={index}
              onChange={(updates) => updateColumn(column.id, updates)}
              onDelete={() => removeColumn(column.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Компонент редактора колонки
interface ColumnEditorProps {
  column: ColumnDefinition;
  index: number;
  onChange: (updates: Partial<ColumnDefinition>) => void;
  onDelete: () => void;
}

function ColumnEditor({
  column,
  index,
  onChange,
  onDelete,
}: ColumnEditorProps) {
  const updateColumn = (updates: Partial<ColumnDefinition>) => {
    onChange(updates);
  };

  const toggleConstraint = (constraint: string) => {
    const currentConstraints = column.constraints;
    const newConstraints = currentConstraints.includes(constraint as any)
      ? currentConstraints.filter((c) => c !== constraint)
      : [...currentConstraints, constraint as any];

    updateColumn({ constraints: newConstraints });
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">Колонка #{index + 1}</h4>
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 transition-colors"
        >
          🗑️ Удалить
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Имя колонки */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Имя
          </label>
          <input
            type="text"
            value={column.name}
            onChange={(e) => updateColumn({ name: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="column_name"
          />
        </div>

        {/* Тип данных */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тип данных
          </label>
          <select
            value={column.type}
            onChange={(e) => updateColumn({ type: e.target.value as DataType })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            {Object.entries(DATA_TYPES).map(([type, info]) => (
              <option key={type} value={type}>
                {info.name}
              </option>
            ))}
          </select>
        </div>

        {/* Длина (для некоторых типов) */}
        {(DATA_TYPES[column.type].supportsLength ||
          DATA_TYPES[column.type].supportsPrecision) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {DATA_TYPES[column.type].supportsPrecision ? "Точность" : "Длина"}
            </label>
            <input
              type="number"
              value={column.length || column.precision || ""}
              onChange={(e) => {
                const value = e.target.value
                  ? parseInt(e.target.value)
                  : undefined;
                if (DATA_TYPES[column.type].supportsPrecision) {
                  updateColumn({ precision: value });
                } else {
                  updateColumn({ length: value });
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder={
                DATA_TYPES[column.type].defaultLength?.toString() || "255"
              }
            />
          </div>
        )}

        {/* Масштаб (для DECIMAL) */}
        {(column.type === "DECIMAL" || column.type === "NUMERIC") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Масштаб
            </label>
            <input
              type="number"
              value={column.scale || ""}
              onChange={(e) =>
                updateColumn({
                  scale: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="2"
            />
          </div>
        )}
      </div>

      {/* Ограничения */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ограничения
        </label>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={!column.nullable}
              onChange={(e) => updateColumn({ nullable: !e.target.checked })}
              className="rounded"
            />
            NOT NULL
          </label>

          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={column.constraints.includes("PRIMARY_KEY")}
              onChange={() => toggleConstraint("PRIMARY_KEY")}
              className="rounded"
            />
            PRIMARY KEY
          </label>

          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={column.constraints.includes("UNIQUE")}
              onChange={() => toggleConstraint("UNIQUE")}
              className="rounded"
            />
            UNIQUE
          </label>

          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={column.constraints.includes("AUTO_INCREMENT")}
              onChange={() => toggleConstraint("AUTO_INCREMENT")}
              className="rounded"
            />
            AUTO INCREMENT
          </label>
        </div>
      </div>

      {/* Значение по умолчанию */}
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Значение по умолчанию
        </label>
        <input
          type="text"
          value={column.defaultValue || ""}
          onChange={(e) =>
            updateColumn({ defaultValue: e.target.value || undefined })
          }
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          placeholder="NULL или значение"
        />
      </div>
    </div>
  );
}
