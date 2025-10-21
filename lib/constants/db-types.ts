import { DataType, DatabaseType, Constraint } from "../types/base";

export const DATA_TYPES: Record<
  DataType,
  {
    name: string;
    category:
      | "numeric"
      | "string"
      | "boolean"
      | "temporal"
      | "binary"
      | "other";
    supportsLength: boolean;
    supportsPrecision: boolean;
    defaultLength?: number;
    description: string;
  }
> = {
  INTEGER: {
    name: "INTEGER",
    category: "numeric",
    supportsLength: false,
    supportsPrecision: false,
    description: "Целое число (4 байта)",
  },
  BIGINT: {
    name: "BIGINT",
    category: "numeric",
    supportsLength: false,
    supportsPrecision: false,
    description: "Большое целое число (8 байт)",
  },
  SMALLINT: {
    name: "SMALLINT",
    category: "numeric",
    supportsLength: false,
    supportsPrecision: false,
    description: "Малое целое число (2 байта)",
  },
  TINYINT: {
    name: "TINYINT",
    category: "numeric",
    supportsLength: false,
    supportsPrecision: false,
    description: "Очень малое целое число (1 байт)",
  },
  VARCHAR: {
    name: "VARCHAR",
    category: "string",
    supportsLength: true,
    supportsPrecision: false,
    defaultLength: 255,
    description: "Строка переменной длины",
  },
  TEXT: {
    name: "TEXT",
    category: "string",
    supportsLength: false,
    supportsPrecision: false,
    description: "Текст неограниченной длины",
  },
  CHAR: {
    name: "CHAR",
    category: "string",
    supportsLength: true,
    supportsPrecision: false,
    defaultLength: 1,
    description: "Строка фиксированной длины",
  },
  DECIMAL: {
    name: "DECIMAL",
    category: "numeric",
    supportsLength: false,
    supportsPrecision: true,
    description: "Точное десятичное число",
  },
  NUMERIC: {
    name: "NUMERIC",
    category: "numeric",
    supportsLength: false,
    supportsPrecision: true,
    description: "Точное числовое значение",
  },
  FLOAT: {
    name: "FLOAT",
    category: "numeric",
    supportsLength: false,
    supportsPrecision: false,
    description: "Число с плавающей точкой",
  },
  REAL: {
    name: "REAL",
    category: "numeric",
    supportsLength: false,
    supportsPrecision: false,
    description: "Число с плавающей точкой одинарной точности",
  },
  BOOLEAN: {
    name: "BOOLEAN",
    category: "boolean",
    supportsLength: false,
    supportsPrecision: false,
    description: "Логическое значение TRUE/FALSE",
  },
  BOOL: {
    name: "BOOL",
    category: "boolean",
    supportsLength: false,
    supportsPrecision: false,
    description: "Алиас для BOOLEAN",
  },
  DATE: {
    name: "DATE",
    category: "temporal",
    supportsLength: false,
    supportsPrecision: false,
    description: "Дата (год-месяц-день)",
  },
  TIME: {
    name: "TIME",
    category: "temporal",
    supportsLength: false,
    supportsPrecision: false,
    description: "Время (часы:минуты:секунды)",
  },
  DATETIME: {
    name: "DATETIME",
    category: "temporal",
    supportsLength: false,
    supportsPrecision: false,
    description: "Дата и время",
  },
  TIMESTAMP: {
    name: "TIMESTAMP",
    category: "temporal",
    supportsLength: false,
    supportsPrecision: false,
    description: "Метка времени",
  },
  BLOB: {
    name: "BLOB",
    category: "binary",
    supportsLength: false,
    supportsPrecision: false,
    description: "Бинарные данные",
  },
  JSON: {
    name: "JSON",
    category: "other",
    supportsLength: false,
    supportsPrecision: false,
    description: "Данные в формате JSON",
  },
  UUID: {
    name: "UUID",
    category: "other",
    supportsLength: false,
    supportsPrecision: false,
    description: "Универсальный уникальный идентификатор",
  },
};

export const SUPPORTED_TYPES: Record<DatabaseType, DataType[]> = {
  mysql: [
    "INTEGER",
    "BIGINT",
    "SMALLINT",
    "TINYINT",
    "VARCHAR",
    "TEXT",
    "CHAR",
    "DECIMAL",
    "NUMERIC",
    "FLOAT",
    "REAL",
    "BOOLEAN",
    "BOOL",
    "DATE",
    "TIME",
    "DATETIME",
    "TIMESTAMP",
    "BLOB",
    "JSON",
  ],
  postgresql: [
    "INTEGER",
    "BIGINT",
    "SMALLINT",
    "VARCHAR",
    "TEXT",
    "CHAR",
    "DECIMAL",
    "NUMERIC",
    "FLOAT",
    "REAL",
    "BOOLEAN",
    "DATE",
    "TIME",
    "TIMESTAMP",
    "JSON",
    "UUID",
  ],
  sqlite: [
    "INTEGER",
    "BIGINT",
    "VARCHAR",
    "TEXT",
    "REAL",
    "BOOLEAN",
    "DATE",
    "TIME",
    "DATETIME",
    "BLOB",
  ],
};

export const DEFAULT_CONSTRAINTS: Record<DatabaseType, Constraint[]> = {
  mysql: ["NOT_NULL"],
  postgresql: ["NOT_NULL"],
  sqlite: ["NOT_NULL"],
};
