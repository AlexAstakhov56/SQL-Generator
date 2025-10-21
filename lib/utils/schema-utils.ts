import {
  ColumnDefinition,
  TableSchema,
  DataType,
  DatabaseType,
  DATA_TYPES,
  SUPPORTED_TYPES,
} from "../types";

export function createDefaultColumn(): ColumnDefinition {
  return {
    id: generateId(),
    name: "new_column",
    type: "VARCHAR",
    length: 255,
    nullable: false,
    constraints: ["NOT_NULL"],
    dbSpecific: {},
  };
}

export function createDefaultTable(): TableSchema {
  return {
    id: generateId(),
    name: "new_table",
    columns: [
      {
        id: generateId(),
        name: "id",
        type: "INTEGER",
        nullable: false,
        constraints: ["PRIMARY_KEY", "AUTO_INCREMENT"],
        dbSpecific: {},
      },
    ],
    indexes: [],
    relationships: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateTableName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return "Название таблицы не может быть пустым";
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    return "Название таблицы может содержать только буквы, цифры и подчеркивания, и должно начинаться с буквы или подчеркивания";
  }

  if (name.length > 64) {
    return "Название таблицы не может быть длиннее 64 символов";
  }

  return null;
}

// Проверка поддержки типа данных в СУБД
export function isTypeSupported(
  dataType: DataType,
  dbType: DatabaseType
): boolean {
  const supportedTypes = SUPPORTED_TYPES[dbType];
  return supportedTypes.includes(dataType);
}

export function getDataTypeInfo(dataType: DataType) {
  return DATA_TYPES[dataType];
}
