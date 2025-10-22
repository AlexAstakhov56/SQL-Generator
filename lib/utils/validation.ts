import { TableSchema, ColumnDefinition } from "../types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export function validateTableSchema(schema: TableSchema): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Проверка имени таблицы
  if (!schema.name || schema.name.trim().length === 0) {
    errors.push("Название таблицы обязательно");
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema.name)) {
    errors.push(
      "Название таблицы может содержать только буквы, цифры и подчеркивания, и должно начинаться с буквы"
    );
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

  // Проверка отдельных колонок
  schema.columns.forEach((column, index) => {
    const columnErrors = validateColumn(column, index);
    errors.push(...columnErrors.errors);
    //warnings.push(...columnErrors.warnings);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateColumn(
  column: ColumnDefinition,
  index: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!column.name || column.name.trim().length === 0) {
    errors.push(`Колонка ${index + 1}: имя обязательно`);
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column.name)) {
    errors.push(
      `Колонка "${column.name}": имя может содержать только буквы, цифры и подчеркивания`
    );
  }

  if (
    column.constraints.includes("AUTO_INCREMENT") &&
    !column.constraints.includes("PRIMARY_KEY")
  ) {
    warnings.push(
      `Колонка "${column.name}": AUTO_INCREMENT обычно используется с PRIMARY KEY`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
