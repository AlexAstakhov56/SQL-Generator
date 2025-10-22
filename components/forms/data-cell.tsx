import { ColumnDefinition } from "@/lib/types";

// Компонент для ячейки данных с правильным input типом
interface DataCellProps {
  value: any;
  column: ColumnDefinition;
  onChange: (value: any) => void;
  disabled?: boolean;
  isValid?: boolean;
  errorMessage?: string | null;
}

export function DataCell({
  value,
  column,
  onChange,
  disabled = false,
  isValid = true,
  errorMessage = null,
}: DataCellProps) {
  const getInputType = (): string => {
    switch (column.type) {
      case "INTEGER":
      case "BIGINT":
      case "SMALLINT":
      case "DECIMAL":
      case "FLOAT":
        return "number";
      case "BOOLEAN":
        return "checkbox";
      case "DATE":
        return "date";
      case "DATETIME":
      case "TIMESTAMP":
        return "datetime-local";
      default:
        return "text";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const newValue =
      getInputType() === "checkbox" ? e.target.checked : e.target.value;
    onChange(newValue);
  };

  if (disabled) {
    return (
      <div className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-sm border border-gray-200">
        {value || "auto"}
      </div>
    );
  }

  if (getInputType() === "checkbox") {
    return (
      <div className="flex flex-col">
        <input
          type="checkbox"
          checked={!!value}
          onChange={handleChange}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          disabled={disabled}
        />
        {!isValid && errorMessage && (
          <div className="text-xs text-red-600 mt-1">{errorMessage}</div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <input
        type={getInputType()}
        value={value || ""}
        onChange={handleChange}
        disabled={disabled}
        className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 ${
          disabled
            ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
            : !isValid
            ? "border-red-300 bg-red-50 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500"
        }`}
        placeholder={
          disabled
            ? "auto"
            : column.defaultValue || `Введите ${column.type.toLowerCase()}`
        }
      />
      {!isValid && errorMessage && (
        <div className="text-xs text-red-600 mt-1">{errorMessage}</div>
      )}
    </div>
  );
}
