import {
  TableSchema,
  ColumnDefinition,
  GenerationOptions,
  DEFAULT_GENERATION_OPTIONS,
  SelectConfig,
  SelectGenerationOptions,
} from "../../types";
import { BaseSQLGenerator } from "./base-generator";

export class PostgreSQLGenerator extends BaseSQLGenerator {
  generateCreateTable(
    schema: TableSchema,
    options: GenerationOptions = DEFAULT_GENERATION_OPTIONS
  ): string {
    const columnsSQL = this.generateColumns(schema.columns, "postgresql");

    const primaryKeysSQL = this.generatePrimaryKeys(schema.columns);

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
      "postgresql"
    );
    sql += `  ${columnsSQL}\n`;

    // FROM
    sql += `FROM ${config.selectedTables[0]}\n`;

    // JOIN
    const joinsSQL = this.generateJoins(config.joins, "postgresql");
    if (joinsSQL) {
      sql += `${joinsSQL}\n`;
    }

    // WHERE
    const whereSQL = this.generateWhereConditions(
      config.whereConditions,
      "postgresql"
    );
    if (whereSQL) {
      sql += `${whereSQL}\n`;
    }

    // GROUP BY
    const groupBySQL = this.generateGroupBy(config.groupBy, "postgresql");
    if (groupBySQL) {
      sql += `${groupBySQL}\n`;
    }

    // HAVING
    const havingSQL = this.generateHavingConditions(
      config.havingConditions,
      "postgresql"
    );
    if (havingSQL) {
      sql += `${havingSQL}\n`;
    }

    // ORDER BY
    const orderBySQL = this.generateOrderBy(config.orderBy, "postgresql");
    if (orderBySQL) {
      sql += `${orderBySQL}\n`;
    }

    // LIMIT & OFFSET
    if (config.limit) {
      sql += `LIMIT ${config.limit}\n`;
    }

    if (config.offset) {
      sql += `OFFSET ${config.offset}\n`;
    }

    return sql.trim() + ";";
  }

  protected generateColumnDefinition(column: ColumnDefinition): string {
    const parts: string[] = [];

    parts.push(`  ${this.escapeName(column.name)}`);

    if (
      column.constraints.includes("AUTO_INCREMENT") &&
      this.isIntegerType(column.type)
    ) {
      parts.push("SERIAL");
    } else {
      parts.push(this.getDataType(column));
    }

    // NOT NULL
    if (!column.nullable) {
      parts.push("NOT NULL");
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

    if (primaryKeyColumns.length === 0) {
      return "";
    }

    const pkColumnNames = primaryKeyColumns
      .map((col) => this.escapeName(col.name))
      .join(", ");

    return `  PRIMARY KEY (${pkColumnNames})`;
  }

  protected generateSerialColumns(columns: ColumnDefinition[]): string {
    let sql = "";

    columns.forEach((column) => {
      if (
        column.constraints.includes("AUTO_INCREMENT") &&
        this.isIntegerType(column.type)
      ) {
      }
    });

    return sql;
  }

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

    if (typeof value === "string") {
      const upperValue = value.toUpperCase();
      if (
        upperValue === "NULL" ||
        upperValue === "CURRENT_TIMESTAMP" ||
        upperValue === "CURRENT_DATE" ||
        upperValue === "NOW()"
      ) {
        return upperValue === "NOW()" ? "CURRENT_TIMESTAMP" : upperValue;
      }
      return `'${this.escapeString(value)}'`;
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
