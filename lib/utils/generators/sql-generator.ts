import {
  TableSchema,
  DatabaseType,
  GeneratedSQL,
  GenerationOptions,
  SelectConfig,
  SelectGenerationOptions,
  MultiDBGeneratedSQL,
} from "../../types";
import { MySQLGenerator } from "./mysql-generator";
import { PostgreSQLGenerator } from "./postgresql-generator";
import { SQLiteGenerator } from "./sqlite-generator";

export class SQLGenerator {
  static generateSelectForAllDBs(
    config: SelectConfig,
    options: SelectGenerationOptions = {}
  ): MultiDBGeneratedSQL {
    return {
      mysql: this.generateSelect(config, "mysql", options),
      postgresql: this.generateSelect(config, "postgresql", options),
      sqlite: this.generateSelect(config, "sqlite", options),
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

  static generateSelect(
    config: SelectConfig,
    dbType: DatabaseType,
    options: SelectGenerationOptions = {}
  ): GeneratedSQL {
    const generator = this.getGenerator(dbType);

    try {
      const validationResult = this.validateSelectConfig(config, dbType);

      if (validationResult.errors.length > 0) {
        return {
          sql: "",
          dbType,
          warnings: validationResult.warnings,
          errors: validationResult.errors,
        };
      }

      const sql = generator.generateSelect(config, options);

      return {
        sql,
        dbType,
        warnings: validationResult.warnings,
        errors: [],
      };
    } catch (error) {
      return {
        sql: "",
        dbType,
        warnings: [],
        errors: [`Ошибка генерации SELECT: ${error}`],
      };
    }
  }

  private static validateSelectConfig(
    config: SelectConfig,
    dbType: DatabaseType
  ): { warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (config.selectedTables.length === 0) {
      errors.push("Не выбраны таблицы для запроса");
    }

    // Проверка JOIN условий
    config.joins.forEach((join, index) => {
      if (!join.leftColumn || !join.rightColumn) {
        errors.push(
          `JOIN условие #${index + 1} не имеет выбранных колонок для связи`
        );
      }
    });

    // Проверка WHERE условий
    config.whereConditions.forEach((condition, index) => {
      if (!condition.column) {
        warnings.push(`WHERE условие #${index + 1} не имеет выбранной колонки`);
      }
    });

    // Проверка GROUP BY и HAVING
    if (config.havingConditions.length > 0 && config.groupBy.length === 0) {
      warnings.push("HAVING условия используются без GROUP BY");
    }

    // Проверка агрегатных функций с GROUP BY
    const hasAggregateFunctions = config.selectedColumns.some(
      (col) => col.aggregateFunction && col.aggregateFunction !== "NONE"
    );

    if (hasAggregateFunctions && config.groupBy.length === 0) {
      warnings.push("Используются агрегатные функции без GROUP BY");
    }

    return { warnings, errors };
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
