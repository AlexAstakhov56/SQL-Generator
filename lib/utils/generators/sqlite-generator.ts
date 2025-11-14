import {
  TableSchema,
  ColumnDefinition,
  GenerationOptions,
  DEFAULT_GENERATION_OPTIONS,
  SelectConfig,
  SelectGenerationOptions,
} from "../../types";
import { BaseSQLGenerator } from "./base-generator";

export class SQLiteGenerator extends BaseSQLGenerator {
  generateCreateTable(
    schema: TableSchema,
    options: GenerationOptions = DEFAULT_GENERATION_OPTIONS
  ): string {
    const columnsSQL = this.generateColumns(schema.columns, "sqlite");

    const primaryKeysSQL = this.generatePrimaryKeys(schema.columns);

    const foreignKeysSQL = this.generateForeignKeys(
      schema.relationships,
      "sqlite"
    );

    let sql = `CREATE TABLE `;

    if (options.includeIfNotExists) {
      sql += "IF NOT EXISTS ";
    }

    sql += `${schema.name} (\n`;
    sql += columnsSQL;

    if (primaryKeysSQL) {
      sql += `,\n${primaryKeysSQL}`;
    }

    if (foreignKeysSQL) {
      sql += `,\n${foreignKeysSQL}`;
    }

    sql += "\n);";

    return sql;
  }

  generateSelect(
    config: SelectConfig,
    options: SelectGenerationOptions = {}
  ): string {
    if (config.selectedTables.length === 0) {
      throw new Error("Не выбраны таблицы для SELECT запроса");
    }

    const finalOptions = {
      format: true,
      includeAliases: true,
      ...options,
    };

    let sql = "SELECT\n";

    const columnsSQL = this.generateSelectColumns(
      config.selectedColumns,
      "sqlite"
    );
    sql += `  ${columnsSQL}\n`;

    // FROM
    sql += `FROM ${config.selectedTables[0]}\n`;

    // JOIN
    const joinsSQL = this.generateJoins(config.joins, "sqlite");
    if (joinsSQL) {
      sql += `${joinsSQL}\n`;
    }

    // WHERE
    const whereSQL = this.generateWhereConditions(
      config.whereConditions,
      "sqlite"
    );
    if (whereSQL) {
      sql += `${whereSQL}\n`;
    }

    // GROUP BY
    const groupBySQL = this.generateGroupBy(config.groupBy, "sqlite");
    if (groupBySQL) {
      sql += `${groupBySQL}\n`;
    }

    // HAVING
    const havingSQL = this.generateHavingConditions(
      config.havingConditions,
      "sqlite"
    );
    if (havingSQL) {
      sql += `${havingSQL}\n`;
    }

    // ORDER BY
    const orderBySQL = this.generateOrderBy(config.orderBy, "sqlite");
    if (orderBySQL) {
      sql += `${orderBySQL}\n`;
    }

    // LIMIT & OFFSET
    const limitOffsetSQL = this.generateLimitOffset(
      config.limit,
      config.offset
    );
    if (limitOffsetSQL) {
      sql += `${limitOffsetSQL}\n`;
    }

    return sql.trim() + ";";
  }

  protected generateLimitOffset(limit?: number, offset?: number): string {
    if (limit && offset !== undefined) {
      return `LIMIT ${limit} OFFSET ${offset}`;
    }

    if (limit) {
      return `LIMIT ${limit}`;
    }

    return "";
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

    if (column.constraints.includes("PRIMARY_KEY")) {
      parts.push("PRIMARY KEY");
    }

    // AUTOINCREMENT
    if (
      column.constraints.includes("AUTO_INCREMENT") &&
      column.constraints.includes("PRIMARY_KEY") &&
      column.type === "INTEGER"
    ) {
      parts.push("AUTOINCREMENT");
    }

    // DEFAULT
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

  protected generatePrimaryKeys(columns: ColumnDefinition[]): string {
    const primaryKeyColumns = columns.filter((col) =>
      col.constraints.includes("PRIMARY_KEY")
    );

    if (primaryKeyColumns.length > 1) {
      const pkColumnNames = primaryKeyColumns
        .map((col) => this.escapeName(col.name))
        .join(", ");
      return `  PRIMARY KEY (${pkColumnNames})`;
    }

    return "";
  }

  protected getDataType(column: ColumnDefinition): string {
    const { type } = column;

    switch (type) {
      case "INTEGER":
        return "INTEGER";
      case "BIGINT":
        return "INTEGER";
      case "SMALLINT":
        return "INTEGER";
      case "VARCHAR":
      case "TEXT":
        return "TEXT";
      case "CHAR":
        return "TEXT";
      case "BOOLEAN":
        return "INTEGER";
      case "DATE":
        return "TEXT";
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
      return value ? "1" : "0";
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    if (typeof value === "string") {
      const upperValue = value.toUpperCase();
      if (
        upperValue === "NULL" ||
        upperValue === "CURRENT_TIMESTAMP" ||
        upperValue === "CURRENT_TIME" ||
        upperValue === "CURRENT_DATE"
      ) {
        return upperValue;
      }
      return `'${this.escapeString(value)}'`;
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
