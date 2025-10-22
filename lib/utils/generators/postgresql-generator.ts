import {
  TableSchema,
  ColumnDefinition,
  GenerationOptions,
  DEFAULT_GENERATION_OPTIONS,
} from "../../types";
import { BaseSQLGenerator } from "./base-generator";

export class PostgreSQLGenerator extends BaseSQLGenerator {
  generateCreateTable(
    schema: TableSchema,
    options: GenerationOptions = DEFAULT_GENERATION_OPTIONS
  ): string {
    const columnsSQL = this.generateColumns(schema.columns, "postgresql");

    // Генерируем PRIMARY KEY отдельно
    const primaryKeysSQL = this.generatePrimaryKeys(schema.columns);

    // Генерируем FOREIGN KEYS
    const foreignKeysSQL = this.generateForeignKeys(
      schema.relationships,
      "postgresql"
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

    // Добавляем SERIAL для автоинкрементных полей (PostgreSQL специфика)
    const serialColumnsSQL = this.generateSerialColumns(schema.columns);
    if (serialColumnsSQL) {
      sql += serialColumnsSQL;
    }

    // Добавляем комментарий если есть
    if (schema.comment) {
      sql += `\nCOMMENT ON TABLE ${this.escapeName(
        schema.name
      )} IS '${this.escapeString(schema.comment)}';`;
    }

    // Добавляем комментарии к колонкам
    schema.columns.forEach((column) => {
      if (column.comment) {
        sql += `\nCOMMENT ON COLUMN ${this.escapeName(
          schema.name
        )}.${this.escapeName(column.name)} IS '${this.escapeString(
          column.comment
        )}';`;
      }
    });

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

    // Тип данных (для PostgreSQL используем SERIAL для автоинкремента)
    if (
      column.constraints.includes("AUTO_INCREMENT") &&
      this.isIntegerType(column.type)
    ) {
      // Для автоинкрементных INTEGER полей используем SERIAL
      parts.push("SERIAL");
    } else {
      parts.push(this.getDataType(column));
    }

    // NOT NULL
    if (!column.nullable) {
      parts.push("NOT NULL");
    }

    // UNIQUE
    // if (column.constraints.includes("UNIQUE")) {
    //   parts.push("UNIQUE");
    // }

    // DEFAULT (не добавляем для SERIAL полей)
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

  // Новый метод для генерации SERIAL последовательностей (PostgreSQL специфика)
  protected generateSerialColumns(columns: ColumnDefinition[]): string {
    let sql = "";

    columns.forEach((column) => {
      if (
        column.constraints.includes("AUTO_INCREMENT") &&
        this.isIntegerType(column.type)
      ) {
        // Для SERIAL полей устанавливаем начальное значение если нужно
        // Можно добавить кастомные настройки здесь
        // const dbSpecific = column.dbSpecific?.postgresql;
        // if (dbSpecific?.startValue) {
        //   sql += `\nALTER SEQUENCE ${this.escapeName(
        //     column.name + "_seq"
        //   )} START WITH ${dbSpecific.startValue};`;
        // }
      }
    });

    return sql;
  }

  // Проверка является ли тип целочисленным
  protected isIntegerType(type: string): boolean {
    return ["INTEGER", "BIGINT", "SMALLINT"].includes(type);
  }

  protected getDataType(column: ColumnDefinition): string {
    const { type, length, precision, scale } = column;

    switch (type) {
      case "INTEGER":
        return "INTEGER";
      case "BIGINT":
        return "BIGINT";
      case "SMALLINT":
        return "SMALLINT";
      case "VARCHAR":
        return length ? `VARCHAR(${length})` : "VARCHAR";
      case "TEXT":
        return "TEXT";
      case "CHAR":
        return length ? `CHAR(${length})` : "CHAR(1)";
      case "DECIMAL":
      case "NUMERIC":
        if (precision !== undefined && scale !== undefined) {
          return `NUMERIC(${precision}, ${scale})`;
        } else if (precision !== undefined) {
          return `NUMERIC(${precision})`;
        }
        return "NUMERIC";
      case "FLOAT":
        return "FLOAT";
      case "REAL":
        return "REAL";
      case "BOOLEAN":
        return "BOOLEAN";
      case "DATE":
        return "DATE";
      case "TIME":
        return "TIME";
      case "TIMESTAMP":
        return "TIMESTAMP";
      case "JSON":
        return "JSONB";
      case "UUID":
        return "UUID";
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
      return `'${value.toISOString()}'`;
    }

    const stringValue = value.toString();

    // Специальные ключевые слова PostgreSQL
    const upperValue = stringValue.toUpperCase();
    if (upperValue === "CURRENT_TIMESTAMP" || upperValue === "NOW()") {
      return "CURRENT_TIMESTAMP";
    }
    if (upperValue === "CURRENT_DATE") {
      return "CURRENT_DATE";
    }
    if (upperValue === "NULL") {
      return "NULL";
    }

    // Для строковых типов добавляем кавычки
    if (
      columnType &&
      (columnType.includes("CHAR") ||
        columnType.includes("TEXT") ||
        columnType.includes("DATE") ||
        columnType.includes("TIME") ||
        columnType === "JSON" ||
        columnType === "UUID")
    ) {
      return `'${this.escapeString(stringValue)}'`;
    }

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
      return value ? "TRUE" : "FALSE";
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    return `'${this.escapeString(value.toString())}'`;
  }

  protected escapeString(str: string): string {
    return str.replace(/'/g, "''");
  }

  setDatabaseSchema(schema: TableSchema[]): void {
    this.databaseSchema = schema;
  }
}
