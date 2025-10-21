import {
  TableSchema,
  DatabaseType,
  GeneratedSQL,
  MultiDBGeneratedSQL,
  GenerationOptions,
} from "../../types";
import { MySQLGenerator } from "./mysql-generator";
import { PostgreSQLGenerator } from "./postgresql-generator";
import { SQLiteGenerator } from "./sqlite-generator";

export class SQLGenerator {
  static generateForAllDBs(
    schema: TableSchema,
    options: Partial<GenerationOptions> = {}
  ): MultiDBGeneratedSQL {
    const defaultOptions: GenerationOptions = {
      includeComments: true,
      includeIfNotExists: true,
      format: true,
      ...options,
    };

    return {
      mysql: this.generateCreateTable(schema, "mysql", defaultOptions),
      postgresql: this.generateCreateTable(
        schema,
        "postgresql",
        defaultOptions
      ),
      sqlite: this.generateCreateTable(schema, "sqlite", defaultOptions),
    };
  }

  static generateCreateTable(
    schema: TableSchema,
    dbType: DatabaseType,
    options: Partial<GenerationOptions> = {}
  ): GeneratedSQL {
    const generator = this.getGenerator(dbType);
    const warnings: string[] = [];
    const errors: string[] = [];
    console.log(`🔧 Генератор получил:`, {
      tableName: schema.name,
      columnsCount: schema.columns?.length,
      dbType,
    });
    try {
      // Валидация схемы перед генерацией
      const validationResult = this.validateSchema(schema, dbType);
      warnings.push(...validationResult.warnings);
      errors.push(...validationResult.errors);

      if (errors.length > 0) {
        return {
          sql: "",
          dbType,
          warnings,
          errors,
        };
      }

      const finalOptions: GenerationOptions = {
        includeComments: true,
        includeIfNotExists: true,
        format: true,
        ...options,
      };

      const sql = generator.generateCreateTable(schema, finalOptions);
      console.log("🔧 Сгенерированный SQL:", sql);

      return {
        sql,
        dbType,
        warnings,
        errors: [],
      };
    } catch (error) {
      return {
        sql: "",
        dbType,
        warnings,
        errors: [`Ошибка генерации: ${error}`],
      };
    }
  }

  static generateInsert(
    tableName: string,
    data: Record<string, any>[],
    dbType: DatabaseType
  ): GeneratedSQL {
    const generator = this.getGenerator(dbType);

    try {
      const sql = generator.generateInsert(tableName, data);

      return {
        sql,
        dbType,
        warnings: [],
        errors: [],
      };
    } catch (error) {
      return {
        sql: "",
        dbType,
        warnings: [],
        errors: [`Ошибка генерации INSERT: ${error}`],
      };
    }
  }

  private static getGenerator(dbType: DatabaseType) {
    switch (dbType) {
      case "mysql":
        return new MySQLGenerator();
      case "postgresql":
        return new PostgreSQLGenerator();
      case "sqlite":
        return new SQLiteGenerator();
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  private static validateSchema(
    schema: TableSchema,
    dbType: DatabaseType
  ): { warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Проверка имени таблицы
    if (!schema.name || schema.name.trim().length === 0) {
      errors.push("Имя таблицы не может быть пустым");
    }

    // Проверка колонок
    if (schema.columns.length === 0) {
      errors.push("Таблица должна содержать хотя бы одну колонку");
    }

    // Проверка на дублирующиеся имена колонок
    const columnNames = schema.columns.map((col) => col.name.toLowerCase());
    const duplicateColumns = columnNames.filter(
      (name, index) => columnNames.indexOf(name) !== index
    );

    if (duplicateColumns.length > 0) {
      errors.push(
        `Обнаружены дублирующиеся имена колонок: ${duplicateColumns.join(", ")}`
      );
    }

    // Проверка первичного ключа
    const primaryKeyColumns = schema.columns.filter((col) =>
      col.constraints.includes("PRIMARY_KEY")
    );

    if (primaryKeyColumns.length === 0) {
      warnings.push("Рекомендуется определить первичный ключ");
    }

    if (primaryKeyColumns.length > 1) {
      warnings.push(
        "Обнаружено несколько первичных ключей. Рассмотрите использование составного первичного ключа"
      );
    }

    return { warnings, errors };
  }
}
