import { DatabaseSchema, Relationship, TableSchema } from "../types";
import { ValidationResult } from "./validation";

export class MultiTableUtils {
  static createDatabaseSchema(name: string): DatabaseSchema {
    return {
      id: `db_${Date.now()}`,
      name,
      tables: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static addTable(
    database: DatabaseSchema,
    table: TableSchema
  ): DatabaseSchema {
    return {
      ...database,
      tables: [...database.tables, table],
      updatedAt: new Date(),
    };
  }

  // static createRelationship(
  //   database: DatabaseSchema,
  //   relationship: Omit<Relationship, "id">
  // ): DatabaseSchema {
  //   const newRelationship: Relationship = {
  //     ...relationship,
  //     id: `rel_${Date.now()}`,
  //   };

  //   const updatedTables = database.tables.map((table) => {
  //     if (
  //       table.id === relationship.sourceTableId ||
  //       table.id === relationship.targetTableId
  //     ) {
  //       return {
  //         ...table,
  //         relationships: [...table.relationships, newRelationship],
  //         updatedAt: new Date(),
  //       };
  //     }
  //     return table;
  //   });

  //   return {
  //     ...database,
  //     tables: updatedTables,
  //     updatedAt: new Date(),
  //   };
  // }

  static validateRelationships(database: DatabaseSchema): string[] {
    const errors: string[] = [];

    database.tables.forEach((table) => {
      table.relationships.forEach((rel) => {
        const sourceTable = database.tables.find(
          (t) => t.id === rel.sourceTableId
        );
        const targetTable = database.tables.find(
          (t) => t.id === rel.targetTableId
        );

        if (!sourceTable) {
          errors.push(`Связь "${rel.name}": исходная таблица не найдена`);
        }
        if (!targetTable) {
          errors.push(`Связь "${rel.name}": целевая таблица не найдена`);
        }

        if (sourceTable) {
          const sourceColumn = sourceTable.columns.find(
            (c) => c.id === rel.sourceColumnId
          );
          if (!sourceColumn) {
            errors.push(
              `Связь "${rel.name}": исходная колонка не найдена в таблице ${sourceTable.name}`
            );
          }
        }

        if (targetTable) {
          const targetColumn = targetTable.columns.find(
            (c) => c.id === rel.targetColumnId
          );
          if (!targetColumn) {
            errors.push(
              `Связь "${rel.name}": целевая колонка не найдена в таблице ${targetTable.name}`
            );
          }
        }
      });
    });

    return errors;
  }

  static validateSchema(database: DatabaseSchema): ValidationResult {
    const errors: string[] = [];

    if (!database.name) {
      errors.push("Database name is required");
    }

    if (database.tables.length === 0) {
      errors.push("At least one table is required");
    }

    // Проверяем циклические зависимости
    const cycle = this.findCircularDependencies(database);
    if (cycle) {
      errors.push(`Circular dependency detected: ${cycle.join(" -> ")}`);
    }

    // Проверяем корректность связей
    database.tables.forEach((table) => {
      table.relationships.forEach((rel) => {
        const sourceTable = database.tables.find(
          (t) => t.id === rel.sourceTableId
        );
        const targetTable = database.tables.find(
          (t) => t.id === rel.targetTableId
        );

        if (!sourceTable || !targetTable) {
          errors.push(`Invalid relationship: table not found`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static findCircularDependencies(
    database: DatabaseSchema
  ): string[] | null {
    // Реализация поиска циклических зависимостей
    const graph = new Map<string, string[]>();

    database.tables.forEach((table) => {
      graph.set(table.id, []);
    });

    database.tables.forEach((table) => {
      table.relationships.forEach((rel) => {
        if (rel.sourceTableId === table.id) {
          graph.get(table.id)!.push(rel.targetTableId);
        }
      });
    });

    return null;
  }
}
