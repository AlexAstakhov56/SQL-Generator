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

  // Добавляем опциональный параметр для доступа к полной схеме БД
  protected databaseSchema?: TableSchema[];

  // Метод для установки схемы (будет использоваться в MultiTableGenerator)
  setDatabaseSchema(schema: TableSchema[]): void {
    this.databaseSchema = schema;
  }

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
    // Используем реальные имена колонок из index.columns (это массив ID колонок)
    const columnNames = index.columns.map((colId) => {
      if (this.databaseSchema) {
        // Ищем колонку по ID во всей схеме БД
        for (const table of this.databaseSchema) {
          const column = table.columns.find((col) => col.id === colId);
          if (column) return column.name;
        }
      }
      return colId; // fallback - используем ID если не нашли
    });

    const escapedColumns = columnNames
      .map((col) => this.escapeName(col, dbType))
      .join(", ");

    switch (index.type) {
      case "PRIMARY":
        return `  PRIMARY KEY (${escapedColumns})`;
      // case "UNIQUE":
      //   return `  UNIQUE ${this.escapeName(
      //     index.name,
      //     dbType
      //   )} (${escapedColumns})`;
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
    // Получаем реальные имена вместо ID
    const sourceColumnName = this.getColumnNameById(
      relationship.sourceColumnId
    );
    const targetTableName = this.getTableNameById(relationship.targetTableId);
    const targetColumnName = this.getColumnNameById(
      relationship.targetColumnId
    );

    // Если не нашли реальные имена, пропускаем эту связь
    if (!sourceColumnName || !targetTableName || !targetColumnName) {
      console.warn(
        "Пропускаем foreign key с отсутствующими именами:",
        relationship
      );
      return "";
    }

    const sourceColumn = this.escapeName(sourceColumnName, dbType);
    const targetTable = this.escapeName(targetTableName, dbType);
    const targetColumn = this.escapeName(targetColumnName, dbType);

    let sql = `  CONSTRAINT ${this.escapeName(relationship.name, dbType)}`;
    sql += ` FOREIGN KEY (${sourceColumn})`;
    sql += ` REFERENCES ${targetTable} (${targetColumn})`;
    sql += ` ON DELETE ${relationship.onDelete}`;
    sql += ` ON UPDATE ${relationship.onUpdate}`;

    return sql;
  }

  // Вспомогательные методы для получения реальных имен по ID
  private getTableNameById(tableId: string): string | undefined {
    if (!this.databaseSchema) return undefined;

    const table = this.databaseSchema.find((t) => t.id === tableId);
    return table?.name;
  }

  private getColumnNameById(columnId: string): string | undefined {
    if (!this.databaseSchema) return undefined;

    for (const table of this.databaseSchema) {
      const column = table.columns.find((col) => col.id === columnId);
      if (column) return column.name;
    }
    return undefined;
  }
}
