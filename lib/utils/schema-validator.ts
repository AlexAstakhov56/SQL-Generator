import {
  TableSchema,
  ColumnDefinition,
  DatabaseType,
  DataType,
  IndexDefinition,
} from "../types";
import { SUPPORTED_TYPES } from "../constants/db-types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SchemaValidator {
  static validateTableSchema(
    schema: TableSchema,
    dbType: DatabaseType
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Валидация имени таблицы
    const tableNameError = this.validateTableName(schema.name);
    if (tableNameError) errors.push(tableNameError);

    // Валидация колонок
    if (schema.columns.length === 0) {
      errors.push("Таблица должна содержать хотя бы одну колонку");
    }

    schema.columns.forEach((column, index) => {
      const columnResult = this.validateColumn(column, dbType, index);
      errors.push(...columnResult.errors);
      warnings.push(...columnResult.warnings);
    });

    // Проверка на дублирующиеся имена колонок
    const columnNames = schema.columns.map((col) => col.name.toLowerCase());
    const duplicateColumns = this.findDuplicates(columnNames);
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

    // Проверка индексов
    schema.indexes.forEach((index, indexIndex) => {
      const indexResult = this.validateIndex(index, schema.columns, indexIndex);
      errors.push(...indexResult.errors);
      warnings.push(...indexResult.warnings);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateTableName(name: string): string | null {
    if (!name || name.trim().length === 0) {
      return "Название таблицы не может быть пустым";
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      return "Название таблицы может содержать только буквы, цифры и подчеркивания, и должно начинаться с буквы или подчеркивания";
    }

    if (name.length > 64) {
      return "Название таблицы не может быть длиннее 64 символов";
    }

    const reservedWords = [
      "table",
      "select",
      "insert",
      "update",
      "delete",
      "where",
      "from",
    ];
    if (reservedWords.includes(name.toLowerCase())) {
      return `"${name}" является зарезервированным словом в SQL`;
    }

    return null;
  }

  static validateColumn(
    column: ColumnDefinition,
    dbType: DatabaseType,
    index: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Имя колонки
    if (!column.name || column.name.trim().length === 0) {
      errors.push(`Колонка ${index + 1}: имя не может быть пустым`);
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column.name)) {
      errors.push(
        `Колонка "${column.name}": имя может содержать только буквы, цифры и подчеркивания`
      );
    }

    // Тип данных
    if (!this.isTypeSupported(column.type, dbType)) {
      errors.push(
        `Колонка "${column.name}": тип "${column.type}" не поддерживается в ${dbType}`
      );
    }

    // Длина для строковых типов
    if (column.type === "VARCHAR" && (!column.length || column.length <= 0)) {
      warnings.push(
        `Колонка "${column.name}": для типа VARCHAR рекомендуется указать длину`
      );
    }

    // Precision/Scale для числовых типов
    if (
      (column.type === "DECIMAL" || column.type === "NUMERIC") &&
      column.precision === undefined
    ) {
      warnings.push(
        `Колонка "${column.name}": для типа ${column.type} рекомендуется указать точность`
      );
    }

    // AUTO_INCREMENT только для числовых типов
    if (
      column.constraints.includes("AUTO_INCREMENT") &&
      !this.isNumericType(column.type)
    ) {
      errors.push(
        `Колонка "${column.name}": AUTO_INCREMENT может быть применен только к числовым типам`
      );
    }

    // DEFAULT значение
    if (column.defaultValue !== undefined) {
      const defaultValidation = this.validateDefaultValue(
        column.defaultValue,
        column.type
      );
      if (!defaultValidation.isValid) {
        errors.push(`Колонка "${column.name}": ${defaultValidation.error}`);
      }
    }

    // Конфликтующие ограничения
    if (column.nullable && column.constraints.includes("NOT_NULL")) {
      errors.push(
        `Колонка "${column.name}": не может быть одновременно NULL и NOT NULL`
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  static validateIndex(
    index: IndexDefinition,
    columns: ColumnDefinition[],
    Index: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!index.name || index.name.trim().length === 0) {
      errors.push(`Индекс ${Index + 1}: имя не может быть пустым`);
    }

    if (index.columns.length === 0) {
      errors.push(
        `Индекс "${index.name}": должен содержать хотя бы одну колонку`
      );
    }

    // Проверка существования колонок
    index.columns.forEach((columnId: string) => {
      const columnExists = columns.some((col) => col.id === columnId);
      if (!columnExists) {
        errors.push(
          `Индекс "${index.name}": колонка с ID "${columnId}" не найдена`
        );
      }
    });

    return { isValid: errors.length === 0, errors, warnings };
  }

  private static isTypeSupported(
    dataType: DataType,
    dbType: DatabaseType
  ): boolean {
    return SUPPORTED_TYPES[dbType].includes(dataType);
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

  private static validateDefaultValue(
    value: string,
    dataType: DataType
  ): { isValid: boolean; error?: string } {
    try {
      switch (dataType) {
        case "INTEGER":
        case "BIGINT":
        case "SMALLINT":
        case "TINYINT":
          if (!/^-?\d+$/.test(value) && value !== "NULL") {
            return {
              isValid: false,
              error: "значение по умолчанию должно быть целым числом",
            };
          }
          break;

        case "DECIMAL":
        case "NUMERIC":
        case "FLOAT":
        case "REAL":
          if (!/^-?\d*\.?\d+$/.test(value) && value !== "NULL") {
            return {
              isValid: false,
              error: "значение по умолчанию должно быть числом",
            };
          }
          break;

        case "BOOLEAN":
        case "BOOL":
          if (
            !["TRUE", "FALSE", "1", "0", "NULL"].includes(value.toUpperCase())
          ) {
            return {
              isValid: false,
              error: "значение по умолчанию должно быть TRUE, FALSE, 1 или 0",
            };
          }
          break;

        case "DATE":
          if (
            !this.isValidDate(value) &&
            value !== "NULL" &&
            !value.startsWith("CURRENT_")
          ) {
            return {
              isValid: false,
              error: "значение по умолчанию должно быть валидной датой",
            };
          }
          break;
      }

      return { isValid: true };
    } catch {
      return { isValid: false, error: "неверный формат значения по умолчанию" };
    }
  }

  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private static findDuplicates(array: string[]): string[] {
    return array.filter((item, index) => array.indexOf(item) !== index);
  }
}
