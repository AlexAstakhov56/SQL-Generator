import {
  TableSchema,
  ColumnDefinition,
  DatabaseType,
  Relationship,
} from "../../types";
import { BaseSQLGenerator } from "./base-generator";

export class SQLiteGenerator extends BaseSQLGenerator {
  generateCreateTable(schema: TableSchema): string {
    const columnsSQL = this.generateColumns(schema.columns, "sqlite");
    const indexesSQL = this.generateIndexes(
      schema.indexes,
      schema.name,
      "sqlite"
    );

    let sql = `CREATE TABLE ${this.escapeName(schema.name)} (\n`;
    sql += columnsSQL;
    sql += "\n);";

    // Добавляем индексы
    if (indexesSQL) {
      sql += "\n" + indexesSQL;
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

  protected generateColumnDefinition(
    column: ColumnDefinition,
    dbType: DatabaseType
  ): string {
    let sql = `  ${this.escapeName(column.name)} ${this.getDataType(column)}`;

    if (!column.nullable) {
      sql += " NOT NULL";
    }

    if (column.constraints.includes("UNIQUE")) {
      sql += " UNIQUE";
    }

    if (column.constraints.includes("PRIMARY_KEY")) {
      sql += " PRIMARY KEY";
    }

    if (column.constraints.includes("AUTO_INCREMENT")) {
      sql += " AUTOINCREMENT";
    }

    if (column.defaultValue !== undefined) {
      sql += ` DEFAULT ${this.formatValue(column.defaultValue)}`;
    }

    return sql;
  }

  protected getDataType(column: ColumnDefinition): string {
    const { type } = column;

    switch (type) {
      case "INTEGER":
      case "BIGINT":
        return "INTEGER";
      case "VARCHAR":
      case "TEXT":
      case "CHAR":
        return "TEXT";
      case "DECIMAL":
      case "NUMERIC":
      case "FLOAT":
      case "REAL":
        return "REAL";
      case "BOOLEAN":
      case "BOOL":
        return "INTEGER";
      case "DATE":
      case "TIME":
      case "DATETIME":
      case "TIMESTAMP":
        return "TEXT";
      case "BLOB":
        return "BLOB";
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
      return value ? "1" : "0";
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    return `'${this.escapeString(value.toString())}'`;
  }

  protected escapeString(str: string): string {
    return str.replace(/'/g, "''");
  }

  protected generateForeignKeyDefinition(relationship: Relationship): string {
    const sourceColumn = this.escapeName(relationship.sourceColumnId);
    const targetTable = this.escapeName(relationship.targetTableId);
    const targetColumn = this.escapeName(relationship.targetColumnId);

    let sql = `FOREIGN KEY (${sourceColumn})`;
    sql += ` REFERENCES ${targetTable} (${targetColumn})`;
    sql += ` ON DELETE ${relationship.onDelete}`;
    sql += ` ON UPDATE ${relationship.onUpdate}`;

    return sql;
  }
}
