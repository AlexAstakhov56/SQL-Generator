import {
  TableSchema,
  ColumnDefinition,
  DatabaseType,
  DataType,
  Constraint,
  IndexDefinition,
  Relationship,
} from "../types";
import { SUPPORTED_TYPES } from "../constants/db-types";

export class SchemaTransformer {
  static transformForDatabase(
    schema: TableSchema,
    targetDbType: DatabaseType
  ): TableSchema {
    return {
      ...schema,
      columns: schema.columns.map((column) =>
        this.transformColumn(column, targetDbType)
      ),
      indexes: schema.indexes.map((index) =>
        this.transformIndex(index, targetDbType)
      ),
      relationships: schema.relationships.map((rel) =>
        this.transformRelationship(rel, targetDbType)
      ),
    };
  }

  private static transformColumn(
    column: ColumnDefinition,
    targetDbType: DatabaseType
  ): ColumnDefinition {
    const transformed: ColumnDefinition = {
      ...column,
      type: this.transformDataType(column.type, targetDbType),
      constraints: this.transformConstraints(
        column.constraints,
        column.type,
        targetDbType
      ),
      dbSpecific: this.transformDbSpecific(column.dbSpecific, targetDbType),
    };

    // Удаляем неподдерживаемые атрибуты
    if (!this.supportsLength(transformed.type, targetDbType)) {
      delete transformed.length;
    }

    if (!this.supportsPrecision(transformed.type, targetDbType)) {
      delete transformed.precision;
      delete transformed.scale;
    }

    return transformed;
  }

  private static transformDataType(
    dataType: DataType,
    targetDbType: DatabaseType
  ): DataType {
    // Если тип поддерживается в целевой СУБД, оставляем как есть
    if (SUPPORTED_TYPES[targetDbType].includes(dataType)) {
      return dataType;
    }

    // Иначе конвертируем в ближайший аналог
    switch (dataType) {
      case "TINYINT":
      case "SMALLINT":
        return targetDbType === "sqlite" ? "INTEGER" : "INTEGER";

      case "BOOL":
        return "BOOLEAN";

      case "DATETIME":
        return targetDbType === "postgresql" ? "TIMESTAMP" : "TEXT";

      case "UUID":
        return targetDbType === "sqlite" ? "TEXT" : dataType;

      case "JSON":
        return targetDbType === "sqlite" ? "TEXT" : dataType;

      default:
        return "TEXT";
    }
  }

  private static transformConstraints(
    constraints: Constraint[],
    dataType: DataType,
    targetDbType: DatabaseType
  ): Constraint[] {
    return constraints
      .filter((constraint) => {
        switch (constraint) {
          case "AUTO_INCREMENT":
            return this.supportsAutoIncrement(targetDbType, dataType);

          case "CHECK":
            return targetDbType !== "sqlite";

          default:
            return true;
        }
      })
      .map((constraint) => {
        if (constraint === "AUTO_INCREMENT" && targetDbType === "sqlite") {
          return "AUTO_INCREMENT" as Constraint;
        }
        return constraint;
      });
  }

  private static transformDbSpecific(
    dbSpecific: ColumnDefinition["dbSpecific"],
    targetDbType: DatabaseType
  ): ColumnDefinition["dbSpecific"] {
    const transformed: ColumnDefinition["dbSpecific"] = {};

    if (targetDbType === "mysql" && dbSpecific.mysql) {
      transformed.mysql = { ...dbSpecific.mysql };
    } else if (targetDbType === "postgresql" && dbSpecific.postgresql) {
      transformed.postgresql = { ...dbSpecific.postgresql };
    } else if (targetDbType === "sqlite" && dbSpecific.sqlite) {
      transformed.sqlite = { ...dbSpecific.sqlite };
    }

    return transformed;
  }

  private static supportsAutoIncrement(
    dbType: DatabaseType,
    dataType: DataType
  ): boolean {
    if (!this.isNumericType(dataType)) return false;

    return dbType === "mysql" || dbType === "sqlite";
  }

  private static supportsLength(
    dataType: DataType,
    dbType: DatabaseType
  ): boolean {
    const lengthTypes: DataType[] = ["VARCHAR", "CHAR"];
    return lengthTypes.includes(dataType) && dbType !== "sqlite";
  }

  private static supportsPrecision(
    dataType: DataType,
    dbType: DatabaseType
  ): boolean {
    const precisionTypes: DataType[] = ["DECIMAL", "NUMERIC"];
    return precisionTypes.includes(dataType) && dbType !== "sqlite";
  }

  private static isNumericType(dataType: DataType): boolean {
    const numericTypes: DataType[] = [
      "INTEGER",
      "BIGINT",
      "SMALLINT",
      "TINYINT",
      "DECIMAL",
      "NUMERIC",
      "FLOAT",
      "REAL",
    ];
    return numericTypes.includes(dataType);
  }

  private static transformIndex(
    index: IndexDefinition,
    targetDbType: DatabaseType
  ): IndexDefinition {
    if (targetDbType === "sqlite") {
      return {
        ...index,
        type: index.type === "FULLTEXT" ? "INDEX" : index.type,
      };
    }

    return index;
  }

  private static transformRelationship(
    relationship: Relationship,
    targetDbType: DatabaseType
  ): Relationship {
    if (targetDbType === "sqlite") {
      return {
        ...relationship,
        onDelete:
          relationship.onDelete === "SET_NULL"
            ? "NO_ACTION"
            : relationship.onDelete,
        onUpdate:
          relationship.onUpdate === "SET_NULL"
            ? "NO_ACTION"
            : relationship.onUpdate,
      };
    }

    return relationship;
  }

  static normalizeSchema(schema: TableSchema): TableSchema {
    return {
      ...schema,
      columns: schema.columns.map((column) => this.normalizeColumn(column)),
      indexes: schema.indexes.map((index) => this.normalizeIndex(index)),
      relationships: schema.relationships.map((rel) =>
        this.normalizeRelationship(rel)
      ),
    };
  }

  private static normalizeColumn(column: ColumnDefinition): ColumnDefinition {
    const normalized: ColumnDefinition = {
      ...column,
      name: column.name.trim(),
      constraints: [...new Set(column.constraints)], // Удаляем дубликаты
    };

    // Проверяем, что NOT_NULL соответствует nullable
    if (normalized.constraints.includes("NOT_NULL")) {
      normalized.nullable = false;
    }

    // Проверяем, что PRIMARY_KEY включает NOT_NULL
    if (
      normalized.constraints.includes("PRIMARY_KEY") &&
      !normalized.constraints.includes("NOT_NULL")
    ) {
      normalized.constraints.push("NOT_NULL");
      normalized.nullable = false;
    }

    return normalized;
  }

  private static normalizeIndex(index: IndexDefinition): IndexDefinition {
    return {
      ...index,
      name: index.name.trim(),
      columns: [...new Set(index.columns)], // Удаляем дубликаты колонок
    };
  }

  private static normalizeRelationship(
    relationship: Relationship
  ): Relationship {
    return {
      ...relationship,
      name: relationship.name.trim(),
    };
  }

  static compareSchemas(
    schema1: TableSchema,
    schema2: TableSchema
  ): SchemaComparisonResult {
    const differences: string[] = [];

    // Сравнение имен таблиц
    if (schema1.name !== schema2.name) {
      differences.push(`Имя таблицы: "${schema1.name}" vs "${schema2.name}"`);
    }

    // Сравнение колонок
    const columnNames1 = schema1.columns.map((c) => c.name);
    const columnNames2 = schema2.columns.map((c) => c.name);

    // Найдем добавленные колонки
    const addedColumns = columnNames2.filter(
      (name) => !columnNames1.includes(name)
    );
    if (addedColumns.length > 0) {
      differences.push(`Добавлены колонки: ${addedColumns.join(", ")}`);
    }

    // Найдем удаленные колонки
    const removedColumns = columnNames1.filter(
      (name) => !columnNames2.includes(name)
    );
    if (removedColumns.length > 0) {
      differences.push(`Удалены колонки: ${removedColumns.join(", ")}`);
    }

    // Сравнение измененных колонок
    schema1.columns.forEach((col1) => {
      const col2 = schema2.columns.find((c) => c.name === col1.name);
      if (col2) {
        const columnDiff = this.compareColumns(col1, col2);
        if (columnDiff.length > 0) {
          differences.push(`Колонка "${col1.name}": ${columnDiff.join(", ")}`);
        }
      }
    });

    return {
      hasDifferences: differences.length > 0,
      differences,
    };
  }

  private static compareColumns(
    col1: ColumnDefinition,
    col2: ColumnDefinition
  ): string[] {
    const differences: string[] = [];

    if (col1.type !== col2.type) {
      differences.push(`тип: ${col1.type} -> ${col2.type}`);
    }

    if (col1.nullable !== col2.nullable) {
      differences.push(`nullable: ${col1.nullable} -> ${col2.nullable}`);
    }

    if (col1.length !== col2.length) {
      differences.push(`length: ${col1.length} -> ${col2.length}`);
    }

    // Сравнение ограничений
    const constraints1 = new Set(col1.constraints);
    const constraints2 = new Set(col2.constraints);

    const addedConstraints = [...constraints2].filter(
      (c) => !constraints1.has(c)
    );
    const removedConstraints = [...constraints1].filter(
      (c) => !constraints2.has(c)
    );

    if (addedConstraints.length > 0) {
      differences.push(`добавлены ограничения: ${addedConstraints.join(", ")}`);
    }

    if (removedConstraints.length > 0) {
      differences.push(`удалены ограничения: ${removedConstraints.join(", ")}`);
    }

    return differences;
  }
}

export interface SchemaComparisonResult {
  hasDifferences: boolean;
  differences: string[];
}
