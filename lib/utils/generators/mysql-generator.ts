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

    if (foreignKeysSQL) {
      sql += `,\n${foreignKeysSQL}`;
    }

    sql += "\n)";

    // Добавляем комментарий если есть
    if (schema.comment) {
      sql += ` COMMENT='${this.escapeString(schema.comment)}'`;
    }

    const mysqlOptions = options.mysql || {};

    if (mysqlOptions.engine) {
      sql += ` ENGINE=${mysqlOptions.engine}`;
    }
    if (mysqlOptions.charset) {
      sql += ` CHARSET=${mysqlOptions.charset}`;
    }
    if (mysqlOptions.collation) {
      sql += ` COLLATE=${mysqlOptions.collation}`;
    }

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
    let sql = `  ${this.escapeName(column.name)} ${this.getDataType(column)}`;

    if (column.nullable) {
      sql += " NULL";
    } else {
      sql += " NOT NULL";
    }

    if (column.constraints.includes("AUTO_INCREMENT")) {
      sql += " AUTO_INCREMENT";
    }

    if (column.constraints.includes("UNIQUE")) {
      sql += " UNIQUE";
    }

    if (column.defaultValue !== undefined) {
      sql += ` DEFAULT ${this.formatValue(column.defaultValue)}`;
    }

    if (column.comment) {
      sql += ` COMMENT '${this.escapeString(column.comment)}'`;
    }

    if (column.constraints.includes("PRIMARY_KEY")) {
      sql += " PRIMARY KEY";
    }

    return sql;
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
}
