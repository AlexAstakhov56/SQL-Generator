// lib/utils/generators/sqlite-generator.ts
import {
  TableSchema,
  ColumnDefinition,
  GenerationOptions,
  DEFAULT_GENERATION_OPTIONS,
} from "../../types";
import { BaseSQLGenerator } from "./base-generator";

export class SQLiteGenerator extends BaseSQLGenerator {
  generateCreateTable(
    schema: TableSchema,
    options: GenerationOptions = DEFAULT_GENERATION_OPTIONS
  ): string {
    const columnsSQL = this.generateColumns(schema.columns, "sqlite");

    // Генерируем PRIMARY KEY отдельно
    const primaryKeysSQL = this.generatePrimaryKeys(schema.columns);

    // Генерируем FOREIGN KEYS
    const foreignKeysSQL = this.generateForeignKeys(
      schema.relationships,
      "sqlite"
    );

    let sql = `CREATE TABLE `;

    if (options.includeIfNotExists) {
      sql += "IF NOT EXISTS ";
    }

    sql += `${this.escapeName(schema.name)} (\n`;
    sql += columnsSQL;

    // Добавляем PRIMARY KEY если есть
    if (primaryKeysSQL) {
      sql += `,\n${primaryKeysSQL}`;
    }

    // Добавляем FOREIGN KEYS если есть
    if (foreignKeysSQL) {
      sql += `,\n${foreignKeysSQL}`;
    }

    sql += "\n);";

    // Добавляем комментарии если есть (SQLite не поддерживает COMMENT ON)
    // В SQLite комментарии добавляются отдельными запросами
    if (schema.comment) {
      sql += `\n-- ${schema.comment}`;
    }

    return sql;
  }

  generateInsert(tableName: string, data: Record<string, any>[]): string {
    if (data.length === 0) {
      return "";
    }

    const columns = Object.keys(data[0]);
    const escapedColumns = columns.map((col) => this.escapeName(col));

    const values = data
      .map(
        (row) =>
          `(${columns.map((col) => this.formatValue(row[col])).join(", ")})`
      )
      .join(",\n");

    return `INSERT INTO ${this.escapeName(tableName)} (${escapedColumns.join(
      ", "
    )})\nVALUES ${values};`;
  }

  protected generateColumnDefinition(column: ColumnDefinition): string {
    const parts: string[] = [];

    // Имя колонки
    parts.push(`  ${this.escapeName(column.name)}`);

    // Тип данных
    parts.push(this.getDataType(column));

    // NOT NULL
    if (!column.nullable) {
      parts.push("NOT NULL");
    }

    // PRIMARY KEY (только если одна колонка, иначе выносим в отдельный constraint)
    if (column.constraints.includes("PRIMARY_KEY")) {
      // Для SQLite PRIMARY KEY может быть в определении колонки только если это одна колонка
      parts.push("PRIMARY KEY");
    }

    // AUTOINCREMENT (только для INTEGER PRIMARY KEY)
    if (
      column.constraints.includes("AUTO_INCREMENT") &&
      column.constraints.includes("PRIMARY_KEY") &&
      column.type === "INTEGER"
    ) {
      parts.push("AUTOINCREMENT");
    }

    // UNIQUE
    // if (column.constraints.includes("UNIQUE")) {
    //   parts.push("UNIQUE");
    // }

    // DEFAULT (не добавляем для AUTOINCREMENT полей)
    if (
      column.defaultValue !== undefined &&
      column.defaultValue !== "" &&
      !column.constraints.includes("AUTO_INCREMENT")
    ) {
      parts.push(
        `DEFAULT ${this.formatDefaultValue(column.defaultValue, column.type)}`
      );
    }

    return parts.join(" ");
  }

  // Переопределяем метод для SQLite (особенности с PRIMARY KEY)
  protected generatePrimaryKeys(columns: ColumnDefinition[]): string {
    const primaryKeyColumns = columns.filter((col) =>
      col.constraints.includes("PRIMARY_KEY")
    );

    // Если первичный ключ составной (несколько колонок), генерируем отдельный constraint
    if (primaryKeyColumns.length > 1) {
      const pkColumnNames = primaryKeyColumns
        .map((col) => this.escapeName(col.name))
        .join(", ");
      return `  PRIMARY KEY (${pkColumnNames})`;
    }

    // Если первичный ключ одной колонки, он уже добавлен в определении колонки
    return "";
  }

  protected getDataType(column: ColumnDefinition): string {
    const { type, length } = column;

    // SQLite имеет гибкую типизацию, но лучше использовать стандартные типы
    switch (type) {
      case "INTEGER":
        return "INTEGER";
      case "BIGINT":
        return "INTEGER"; // SQLite использует INTEGER для всех целых чисел
      case "SMALLINT":
        return "INTEGER";
      case "VARCHAR":
      case "TEXT":
        return "TEXT";
      case "CHAR":
        return "TEXT"; // SQLite не различает CHAR и TEXT
      case "BOOLEAN":
        return "INTEGER"; // SQLite использует 0/1 для boolean
      case "DATE":
        return "TEXT"; // SQLite хранит даты как TEXT в формате ISO
      case "DATETIME":
      case "TIMESTAMP":
        return "TEXT";
      case "REAL":
        return "REAL";
      case "BLOB":
        return "BLOB";
      case "NUMERIC":
        return "NUMERIC";
      default:
        return "TEXT";
    }
  }

  protected formatDefaultValue(value: any, columnType?: string): string {
    if (value === null || value === undefined) {
      return "NULL";
    }

    if (typeof value === "number") {
      return value.toString();
    }

    if (typeof value === "boolean") {
      return value ? "1" : "0"; // SQLite использует 1/0 для boolean
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    const stringValue = value.toString();

    // Специальные ключевые слова SQLite
    const upperValue = stringValue.toUpperCase();
    if (
      upperValue === "CURRENT_TIMESTAMP" ||
      upperValue === "CURRENT_TIME" ||
      upperValue === "CURRENT_DATE"
    ) {
      return upperValue;
    }
    if (upperValue === "NULL") {
      return "NULL";
    }

    // Для строковых типов добавляем кавычки
    return `'${this.escapeString(stringValue)}'`;
  }

  protected escapeName(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
  }

  protected formatValue(value: any): string {
    if (value === null || value === undefined) {
      return "NULL";
    }

    if (typeof value === "number") {
      return value.toString();
    }

    if (typeof value === "boolean") {
      return value ? "1" : "0"; // SQLite использует 1/0 для boolean
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    return `'${this.escapeString(value.toString())}'`;
  }

  protected escapeString(str: string): string {
    return str.replace(/'/g, "''");
  }

  // SQLite специфичные методы
  generateEnableForeignKeys(): string {
    return "PRAGMA foreign_keys = ON;";
  }
}
