import {
  TableSchema,
  ColumnDefinition,
  IndexDefinition,
  Relationship,
  DatabaseType,
  GenerationOptions,
} from "../../types";

export abstract class BaseSQLGenerator {
  abstract generateCreateTable(
    schema: TableSchema,
    options: GenerationOptions
  ): string;
  abstract generateInsert(
    tableName: string,
    data: Record<string, any>[]
  ): string;

  protected generateColumns(
    columns: ColumnDefinition[],
    dbType: DatabaseType
  ): string {
    return columns
      .map((column) => this.generateColumnDefinition(column, dbType))
      .join(",\n");
  }

  protected generateIndexes(
    indexes: IndexDefinition[],
    tableName: string,
    dbType: DatabaseType
  ): string {
    return indexes
      .map((index) => this.generateIndexDefinition(index, tableName, dbType))
      .filter(Boolean)
      .join("\n");
  }

  protected generateForeignKeys(
    relationships: Relationship[],
    dbType: DatabaseType
  ): string {
    if (relationships.length === 0) {
      return "";
    }

    const foreignKeys = relationships
      .map((relationship) =>
        this.generateForeignKeyDefinition(relationship, dbType)
      )
      .filter(Boolean);

    return foreignKeys.join(",\n");
  }

  protected abstract generateColumnDefinition(
    column: ColumnDefinition,
    dbType: DatabaseType
  ): string;
  protected abstract getDataType(
    column: ColumnDefinition,
    dbType: DatabaseType
  ): string;
  protected abstract escapeName(name: string, dbType: DatabaseType): string;
  protected abstract formatValue(value: any, dbType: DatabaseType): string;
  protected abstract escapeString(str: string, dbType: DatabaseType): string;

  protected generateIndexDefinition(
    index: IndexDefinition,
    tableName: string,
    dbType: DatabaseType
  ): string {
    const escapedColumns = index.columns
      .map((col) => this.escapeName(col, dbType))
      .join(", ");

    switch (index.type) {
      case "PRIMARY":
        return `  PRIMARY KEY (${escapedColumns})`;
      case "UNIQUE":
        return `  UNIQUE ${this.escapeName(
          index.name,
          dbType
        )} (${escapedColumns})`;
      case "INDEX":
        return `  INDEX ${this.escapeName(
          index.name,
          dbType
        )} (${escapedColumns})`;
      case "FULLTEXT":
        return `  FULLTEXT ${this.escapeName(
          index.name,
          dbType
        )} (${escapedColumns})`;
      default:
        return "";
    }
  }

  protected generateForeignKeyDefinition(
    relationship: Relationship,
    dbType: DatabaseType
  ): string {
    const sourceColumn = this.escapeName(relationship.sourceColumnId, dbType);
    const targetTable = this.escapeName(relationship.targetTableId, dbType);
    const targetColumn = this.escapeName(relationship.targetColumnId, dbType);

    let sql = `  CONSTRAINT ${this.escapeName(relationship.name, dbType)}`;
    sql += ` FOREIGN KEY (${sourceColumn})`;
    sql += ` REFERENCES ${targetTable} (${targetColumn})`;
    sql += ` ON DELETE ${relationship.onDelete}`;
    sql += ` ON UPDATE ${relationship.onUpdate}`;

    return sql;
  }
}
