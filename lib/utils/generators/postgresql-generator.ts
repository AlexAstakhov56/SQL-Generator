import { TableSchema, ColumnDefinition } from "../../types";
import { BaseSQLGenerator } from "./base-generator";

export class PostgreSQLGenerator extends BaseSQLGenerator {
  generateCreateTable(schema: TableSchema): string {
    const columnsSQL = this.generateColumns(schema.columns, "postgresql");
    const foreignKeysSQL = this.generateForeignKeys(
      schema.relationships,
      "postgresql"
    );

    let sql = `CREATE TABLE ${this.escapeName(schema.name)} (\n`;
    sql += columnsSQL;

    if (foreignKeysSQL) {
      sql += `,\n${foreignKeysSQL}`;
    }

    sql += "\n);";

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
    let sql = `  ${this.escapeName(column.name)} ${this.getDataType(column)}`;

    if (!column.nullable) {
      sql += " NOT NULL";
    }

    if (column.constraints.includes("UNIQUE")) {
      sql += " UNIQUE";
    }

    if (column.defaultValue !== undefined) {
      sql += ` DEFAULT ${this.formatValue(column.defaultValue)}`;
    }

    return sql;
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
}
