import { ColumnDefinition } from "../types";

export function generateTestData(
  columns: ColumnDefinition[],
  rowCount: number = 5
): Record<string, any>[] {
  const data: Record<string, any>[] = [];

  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, any> = {};

    columns.forEach((column) => {
      row[column.name] = generateValueForColumn(column, i);
    });

    data.push(row);
  }

  return data;
}

function generateValueForColumn(
  column: ColumnDefinition,
  rowIndex: number
): any {
  const isPrimaryKey = column.constraints.includes("PRIMARY_KEY");
  const isAutoIncrement = column.constraints.includes("AUTO_INCREMENT");

  // Для первичного ключа с автоинкрементом
  if (isPrimaryKey && isAutoIncrement) {
    return rowIndex + 1;
  }

  // Для первичного ключа без автоинкремента
  if (isPrimaryKey) {
    return `id_${rowIndex + 1}`;
  }

  // Генерация на основе типа данных
  switch (column.type) {
    case "INTEGER":
    case "BIGINT":
    case "SMALLINT":
    case "TINYINT":
      return Math.floor(Math.random() * 1000) + 1;

    case "VARCHAR":
    case "TEXT":
    case "CHAR":
      const prefix = column.name.toLowerCase();
      return `${prefix}_value_${rowIndex + 1}`;

    case "DECIMAL":
    case "NUMERIC":
    case "FLOAT":
    case "REAL":
      return parseFloat((Math.random() * 1000).toFixed(2));

    case "BOOLEAN":
    case "BOOL":
      return Math.random() > 0.5;

    case "DATE":
      const date = new Date();
      date.setDate(date.getDate() + rowIndex);
      return date.toISOString().split("T")[0];

    case "TIME":
      return new Date().toISOString().split("T")[1].split(".")[0];

    case "DATETIME":
    case "TIMESTAMP":
      const datetime = new Date();
      datetime.setHours(datetime.getHours() + rowIndex);
      return datetime.toISOString().slice(0, 19).replace("T", " ");

    case "BLOB":
      return Buffer.from(`blob_data_${rowIndex}`).toString("base64");

    case "JSON":
      return JSON.stringify({ id: rowIndex, name: `item_${rowIndex}` });

    case "UUID":
      return generateUUID();

    default:
      return `value_${rowIndex + 1}`;
  }
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatSQL(sql: string): string {
  return sql
    .replace(
      /\b(SELECT|FROM|WHERE|INSERT INTO|VALUES|CREATE TABLE|ALTER TABLE|DROP TABLE|UPDATE|DELETE FROM|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|ON|AND|OR|ORDER BY|GROUP BY|HAVING|LIMIT|OFFSET)\b/gi,
      "\n$1"
    )
    .replace(/\),/g, "),\n")
    .replace(/\(/g, "\n  (")
    .replace(/\)/g, "\n)")
    .trim();
}

export function highlightSQL(sql: string): string {
  const keywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "INSERT",
    "INTO",
    "VALUES",
    "CREATE",
    "TABLE",
    "ALTER",
    "DROP",
    "UPDATE",
    "DELETE",
    "JOIN",
    "LEFT",
    "RIGHT",
    "INNER",
    "OUTER",
    "ON",
    "AND",
    "OR",
    "ORDER",
    "BY",
    "GROUP",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "SET",
    "UNION",
    "ALL",
    "DISTINCT",
    "AS",
    "IS",
    "NULL",
    "NOT",
    "EXISTS",
    "BETWEEN",
    "IN",
    "LIKE",
    "ILIKE",
  ];

  const types = [
    "INTEGER",
    "BIGINT",
    "SMALLINT",
    "TINYINT",
    "VARCHAR",
    "TEXT",
    "CHAR",
    "DECIMAL",
    "NUMERIC",
    "FLOAT",
    "REAL",
    "BOOLEAN",
    "BOOL",
    "DATE",
    "TIME",
    "DATETIME",
    "TIMESTAMP",
    "BLOB",
    "JSON",
    "UUID",
  ];

  const constraints = [
    "PRIMARY",
    "KEY",
    "FOREIGN",
    "REFERENCES",
    "UNIQUE",
    "NOT",
    "NULL",
    "AUTO_INCREMENT",
    "AUTOINCREMENT",
    "DEFAULT",
    "CHECK",
    "CONSTRAINT",
  ];

  let highlighted = sql;

  // Подсветка ключевых слов
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    highlighted = highlighted.replace(
      regex,
      `<span class="sql-keyword">${keyword}</span>`
    );
  });

  // Подсветка типов данных
  types.forEach((type) => {
    const regex = new RegExp(`\\b${type}\\b`, "gi");
    highlighted = highlighted.replace(
      regex,
      `<span class="sql-type">${type}</span>`
    );
  });

  // Подсветка ограничений
  constraints.forEach((constraint) => {
    const regex = new RegExp(`\\b${constraint}\\b`, "gi");
    highlighted = highlighted.replace(
      regex,
      `<span class="sql-constraint">${constraint}</span>`
    );
  });

  // Подсветка строк
  highlighted = highlighted.replace(
    /'([^']*)'/g,
    `<span class="sql-string">'$1'</span>`
  );

  // Подсветка чисел
  highlighted = highlighted.replace(
    /\b\d+\b/g,
    `<span class="sql-number">$&</span>`
  );

  // Подсветка комментариев
  highlighted = highlighted.replace(
    /--.*$/gm,
    `<span class="sql-comment">$&</span>`
  );

  return highlighted;
}
