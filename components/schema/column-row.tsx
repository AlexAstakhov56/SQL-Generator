import { ColumnDefinition, Relationship, TableSchema } from "@/lib/types";

interface ColumnRowProps {
  column: ColumnDefinition;
  table: TableSchema;
  allTables: TableSchema[];
  relationships: Relationship[];
}

export function ColumnRow({
  column,
  table,
  allTables,
  relationships,
}: ColumnRowProps) {
  // Проверяем, является ли колонка внешним ключом
  const isForeignKey = relationships.some(
    (rel) => rel.sourceTableId === table.id && rel.sourceColumnId === column.id
  );

  // Находим целевую таблицу для FK
  const foreignKeyRelation = relationships.find(
    (rel) => rel.sourceTableId === table.id && rel.sourceColumnId === column.id
  );
  const targetTable = foreignKeyRelation
    ? allTables.find((t) => t.id === foreignKeyRelation.targetTableId)
    : null;

  return (
    <div className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-md">
      <div className="flex items-center gap-2 flex-1">
        <div className="flex gap-1">
          {column.constraints.includes("PRIMARY_KEY") && (
            <span
              className="text-sm bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200"
              title="Primary Key"
            >
              PK
            </span>
          )}
          {isForeignKey && (
            <span
              className="text-sm bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200"
              title="Foreign Key"
            >
              FK
            </span>
          )}
          {column.constraints.includes("AUTO_INCREMENT") && (
            <span
              className="text-sm bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200"
              title="Auto Increment"
            >
              AI
            </span>
          )}
        </div>

        <span
          className={`font-mono text-sm ${
            column.constraints.includes("PRIMARY_KEY")
              ? "font-bold text-gray-900"
              : "text-gray-700"
          }`}
        >
          {column.name}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          {getShortType(column.type)}
        </span>

        {isForeignKey && targetTable && (
          <span
            className="text-sm text-blue-600"
            title={`References ${targetTable.name}`}
          >
            → {targetTable.name}
          </span>
        )}

        {(column.constraints?.includes("NOT_NULL") ||
          column.nullable === false) &&
          !column.constraints?.includes("PRIMARY_KEY") && (
            <span className="text-sm text-red-500" title="Not Null">
              NN
            </span>
          )}
      </div>
    </div>
  );
}

// Вспомогательная функция для сокращения типов данных
function getShortType(type: string): string {
  const typeMap: Record<string, string> = {
    INTEGER: "INT",
    BIGINT: "BIGINT",
    SMALLINT: "SMALLINT",
    VARCHAR: "VARCHAR",
    TEXT: "TEXT",
    CHAR: "CHAR",
    BOOLEAN: "BOOL",
    DATE: "DATE",
    DATETIME: "DATETIME",
    TIMESTAMP: "TS",
    DECIMAL: "DEC",
    FLOAT: "FLOAT",
    BLOB: "BLOB",
    JSON: "JSON",
  };
  return typeMap[type] || type;
}
