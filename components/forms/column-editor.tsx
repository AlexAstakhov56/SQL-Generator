import { ColumnDefinition, DataType } from "../../lib/types";
import { DATA_TYPES } from "../../lib/constants/db-types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

interface ColumnEditorProps {
  column: ColumnDefinition;
  index: number;
  onChange: (updates: Partial<ColumnDefinition>) => void;
  onDelete: () => void;
}

export function ColumnEditor({
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

  const dataTypeOptions = Object.entries(DATA_TYPES).map(([value, info]) => ({
    value,
    label: `${info.name} - ${info.description}`,
  }));

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
            Колонка #{index + 1}
          </span>
          {column.constraints.includes("PRIMARY_KEY") && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
              PRIMARY KEY
            </span>
          )}
        </h4>
        <Button variant="danger" size="sm" onClick={onDelete}>
          🗑️ Удалить
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Имя колонки */}
        <Input
          label="Имя колонки"
          value={column.name}
          onChange={(e) => updateColumn({ name: e.target.value })}
          placeholder="username"
          required
        />

        {/* Тип данных */}
        <Select
          label="Тип данных"
          value={column.type}
          onChange={(e) => updateColumn({ type: e.target.value as DataType })}
          options={dataTypeOptions}
        />

        {/* Длина/Точность */}
        {(DATA_TYPES[column.type].supportsLength ||
          DATA_TYPES[column.type].supportsPrecision) && (
          <Input
            label={
              DATA_TYPES[column.type].supportsPrecision ? "Точность" : "Длина"
            }
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
            placeholder={
              DATA_TYPES[column.type].defaultLength?.toString() || "255"
            }
          />
        )}

        {/* Масштаб для DECIMAL */}
        {(column.type === "DECIMAL" || column.type === "NUMERIC") && (
          <Input
            label="Масштаб (decimal places)"
            type="number"
            value={column.scale || ""}
            onChange={(e) =>
              updateColumn({
                scale: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            placeholder="2"
          />
        )}
      </div>

      {/* Ограничения */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ограничения
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!column.nullable}
              onChange={(e) => updateColumn({ nullable: !e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">NOT NULL</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={column.constraints.includes("PRIMARY_KEY")}
              onChange={() => toggleConstraint("PRIMARY_KEY")}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">PRIMARY KEY</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={column.constraints.includes("UNIQUE")}
              onChange={() => toggleConstraint("UNIQUE")}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">UNIQUE</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={column.constraints.includes("AUTO_INCREMENT")}
              onChange={() => toggleConstraint("AUTO_INCREMENT")}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">AUTO INCREMENT</span>
          </label>
        </div>
      </div>

      {/* Значение по умолчанию */}
      <Input
        label="Значение по умолчанию (опционально)"
        value={column.defaultValue || ""}
        onChange={(e) =>
          updateColumn({ defaultValue: e.target.value || undefined })
        }
        placeholder="NULL, CURRENT_TIMESTAMP, 0, etc."
      />
    </div>
  );
}
