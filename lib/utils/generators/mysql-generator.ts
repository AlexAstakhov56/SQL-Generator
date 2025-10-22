import {
  TableSchema,
  ColumnDefinition,
  GenerationOptions,
  DEFAULT_GENERATION_OPTIONS,
} from "../../types";
import { BaseSQLGenerator } from "./base-generator";

export class MySQLGenerator extends BaseSQLGenerator {
  generateCreateTable(
    schema: TableSchema,
    options: GenerationOptions = DEFAULT_GENERATION_OPTIONS
  ): string {
    const columnsSQL = this.generateColumns(schema.columns, "mysql");

    // Генерируем PRIMARY KEY отдельно
    const primaryKeysSQL = this.generatePrimaryKeys(schema.columns);

    // Генерируем FOREIGN KEYS
    const foreignKeysSQL = this.generateForeignKeys(
      schema.relationships,
      "mysql"
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

    sql += "\n)";

    // Добавляем комментарий если есть
    if (schema.comment) {
      sql += ` COMMENT='${this.escapeString(schema.comment)}'`;
    }

    //const mysqlOptions = options.mysql || {};

    // Используем настройки из dbSpecific если они есть
    // const dbSpecific = schema.dbSpecific?.mysql || {};

    // if (dbSpecific.engine || mysqlOptions.engine) {
    //   sql += ` ENGINE=${dbSpecific.engine || mysqlOptions.engine}`;
    // }
    // if (dbSpecific.charset || mysqlOptions.charset) {
    //   sql += ` CHARSET=${dbSpecific.charset || mysqlOptions.charset}`;
    // }
    // if (dbSpecific.collation || mysqlOptions.collation) {
    //   sql += ` COLLATE=${dbSpecific.collation || mysqlOptions.collation}`;
    // }

    return sql + ";";
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

    // NOT NULL / NULL
    if (column.nullable) {
      parts.push("NULL");
    } else {
      parts.push("NOT NULL");
    }

    // AUTO_INCREMENT (должен быть перед DEFAULT)
    if (column.constraints.includes("AUTO_INCREMENT")) {
      parts.push("AUTO_INCREMENT");
    }

    // UNIQUE
    // if (column.constraints.includes("UNIQUE")) {
    //   parts.push("UNIQUE");
    // }

    // DEFAULT (не добавляем для AUTO_INCREMENT полей)
    if (
      column.defaultValue !== undefined &&
      column.defaultValue !== "" &&
      !column.constraints.includes("AUTO_INCREMENT")
    ) {
      parts.push(
        `DEFAULT ${this.formatDefaultValue(column.defaultValue, column.type)}`
      );
    }

    // COMMENT
    if (column.comment) {
      parts.push(`COMMENT '${this.escapeString(column.comment)}'`);
    }

    // PRIMARY KEY НЕ добавляем здесь - выносим в отдельный CONSTRAINT
    // если добавить здесь, будет конфликт с отдельным PRIMARY KEY constraint

    return parts.join(" ");
  }

  // Новый метод для генерации PRIMARY KEY constraints
  protected generatePrimaryKeys(columns: ColumnDefinition[]): string {
    const primaryKeyColumns = columns.filter((col) =>
      col.constraints.includes("PRIMARY_KEY")
    );

    if (primaryKeyColumns.length === 0) {
      return "";
    }

    const pkColumnNames = primaryKeyColumns
      .map((col) => this.escapeName(col.name))
      .join(", ");

    return `  PRIMARY KEY (${pkColumnNames})`;
  }

  protected getDataType(column: ColumnDefinition): string {
    const { type, length, precision, scale } = column;

    switch (type) {
      case "INTEGER":
        return "INT";
      case "BIGINT":
        return "BIGINT";
      case "SMALLINT":
        return "SMALLINT";
      case "TINYINT":
        return "TINYINT";
      case "VARCHAR":
        return length ? `VARCHAR(${length})` : "VARCHAR(255)";
      case "TEXT":
        return "TEXT";
      case "CHAR":
        return length ? `CHAR(${length})` : "CHAR(1)";
      case "DECIMAL":
      case "NUMERIC":
        if (precision !== undefined && scale !== undefined) {
          return `DECIMAL(${precision}, ${scale})`;
        } else if (precision !== undefined) {
          return `DECIMAL(${precision})`;
        }
        return "DECIMAL(10, 2)";
      case "FLOAT":
        return "FLOAT";
      case "REAL":
        return "REAL";
      case "BOOLEAN":
      case "BOOL":
        return "BOOLEAN";
      case "DATE":
        return "DATE";
      case "TIME":
        return "TIME";
      case "DATETIME":
        return "DATETIME";
      case "TIMESTAMP":
        return "TIMESTAMP";
      case "BLOB":
        return "BLOB";
      case "JSON":
        return "JSON";
      default:
        return "TEXT";
    }
  }

  // Новый метод для форматирования DEFAULT значений
  protected formatDefaultValue(value: any, columnType?: string): string {
    if (value === null || value === undefined) {
      return "NULL";
    }

    if (typeof value === "number") {
      return value.toString();
    }

    if (typeof value === "boolean") {
      return value ? "TRUE" : "FALSE";
    }

    if (value instanceof Date) {
      return `'${value.toISOString().slice(0, 19).replace("T", " ")}'`;
    }

    const stringValue = value.toString();

    // Специальные ключевые слова
    if (stringValue.toUpperCase() === "CURRENT_TIMESTAMP") {
      return "CURRENT_TIMESTAMP";
    }
    if (stringValue.toUpperCase() === "NULL") {
      return "NULL";
    }

    // Для строковых типов добавляем кавычки
    if (
      columnType &&
      (columnType.includes("CHAR") ||
        columnType.includes("TEXT") ||
        columnType.includes("DATE") ||
        columnType.includes("TIME") ||
        columnType === "JSON")
    ) {
      return `'${this.escapeString(stringValue)}'`;
    }

    return `'${this.escapeString(stringValue)}'`;
  }

  protected escapeName(name: string): string {
    return `\`${name.replace(/`/g, "``")}\``;
  }

  protected formatValue(value: any): string {
    if (value === null || value === undefined) {
      return "NULL";
    }

    if (typeof value === "number") {
      return value.toString();
    }

    if (typeof value === "boolean") {
      return value ? "TRUE" : "FALSE";
    }

    if (value instanceof Date) {
      return `'${value.toISOString().slice(0, 19).replace("T", " ")}'`;
    }

    return `'${this.escapeString(value.toString())}'`;
  }

  protected escapeString(str: string): string {
    return str.replace(/'/g, "''").replace(/\\/g, "\\\\");
  }

  setDatabaseSchema(schema: TableSchema[]): void {
    this.databaseSchema = schema;
  }
}
