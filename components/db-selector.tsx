import { DatabaseType } from "@/lib/types";

interface DBSelectorProps {
  selectedDB: DatabaseType;
  onDBChange: (db: DatabaseType) => void;
  className?: string;
}

export function DBSelector({
  selectedDB,
  onDBChange,
  className = "",
}: DBSelectorProps) {
  const databases: {
    value: DatabaseType;
    label: string;
    description: string;
  }[] = [
    {
      value: "mysql",
      label: "🐬 MySQL",
      description: "Самый популярный выбор",
    },
    {
      value: "postgresql",
      label: "🐘 PostgreSQL",
      description: "Продвинутые функции",
    },
    {
      value: "sqlite",
      label: "💾 SQLite",
      description: "Быстрое тестирование в браузере",
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg text-center font-semibold">🎯 Выбор СУБД</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {databases.map((db) => (
          <div
            key={db.value}
            className={`
              border-2 rounded-lg p-4 cursor-pointer transition-all bg-white duration-200
              ${
                selectedDB === db.value
                  ? "border-violet-600 border-3 shadow-md"
                  : "border-gray-500 hover:border-gray-300 hover:bg-gray-50"
              }
            `}
            onClick={() => onDBChange(db.value)}
          >
            <div className="font-medium text-gray-900">{db.label}</div>
            <div className="text-sm text-gray-600 mt-1">{db.description}</div>

            {selectedDB === db.value && (
              <div className="mt-2 text-xs text-violet-600 font-medium">
                ✓ Выбрано
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-sm text-center text-gray-500">
        {selectedDB === "mysql" &&
          "Оптимизированный синтаксис MySQL с поддержкой ENGINE, CHARSET"}
        {selectedDB === "postgresql" &&
          "Современный синтаксис PostgreSQL с поддержкой схем и расширенных типов"}
        {selectedDB === "sqlite" &&
          "Упрощенный синтаксис SQLite - быстрое тестирование прямо в браузере"}
      </div>
    </div>
  );
}
