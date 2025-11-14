import {
  TableSchema,
  ColumnDefinition,
  GenerationOptions,
  DEFAULT_GENERATION_OPTIONS,
  SelectConfig,
  SelectGenerationOptions,
} from "../../types";
import { BaseSQLGenerator } from "./base-generator";

export class MySQLGenerator extends BaseSQLGenerator {
  generateCreateTable(
    schema: TableSchema,
    options: GenerationOptions = DEFAULT_GENERATION_OPTIONS
  ): string {
    const columnsSQL = this.generateColumns(schema.columns, "mysql");

    const primaryKeysSQL = this.generatePrimaryKeys(schema.columns);

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

    return sql + ";";
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

    // SELECT колонки
    const columnsSQL = this.generateSelectColumns(
      config.selectedColumns,
      "mysql"
    );
    sql += `  ${columnsSQL}\n`;

    // FROM
    sql += `FROM ${config.selectedTables[0]}\n`;

    // JOIN
    const joinsSQL = this.generateJoins(config.joins, "mysql");
    if (joinsSQL) {
      sql += `${joinsSQL}\n`;
    }

    // WHERE
    const whereSQL = this.generateWhereConditions(
      config.whereConditions,
      "mysql"
    );
    if (whereSQL) {
      sql += `${whereSQL}\n`;
    }

    // GROUP BY
    const groupBySQL = this.generateGroupBy(config.groupBy, "mysql");
    if (groupBySQL) {
      sql += `${groupBySQL}\n`;
    }

    // HAVING
    const havingSQL = this.generateHavingConditions(
      config.havingConditions,
      "mysql"
    );
    if (havingSQL) {
      sql += `${havingSQL}\n`;
    }

    // ORDER BY
    const orderBySQL = this.generateOrderBy(config.orderBy, "mysql");
    if (orderBySQL) {
      sql += `${orderBySQL}\n`;
    }

    // LIMIT & OFFSET
    const limitOffsetSQL = this.generateLimitOffset(
      config.limit,
      config.offset
      //"mysql"
    );
    if (limitOffsetSQL) {
      sql += `${limitOffsetSQL}\n`;
    }

    return sql.trim() + ";";
  }

  protected generateLimitOffset(limit?: number, offset?: number): string {
    if (limit && offset !== undefined) {
      return `LIMIT ${offset}, ${limit}`; // MySQL специфичный синтаксис
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

    if (typeof value === "string") {
      const upperValue = value.toUpperCase();
      if (upperValue === "NULL" || upperValue === "CURRENT_TIMESTAMP") {
        return upperValue;
      }
      return `'${this.escapeString(value)}'`;
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
