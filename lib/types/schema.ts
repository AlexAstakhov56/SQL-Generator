import { DataType, Constraint, IndexType, ForeignKeyAction } from "./base";

export interface ColumnDefinition {
  id: string;
  name: string;
  type: DataType;
  length?: number; // Для VARCHAR, DECIMAL и т.д.
  precision?: number; // Для DECIMAL
  scale?: number; // Для DECIMAL
  nullable: boolean;
  defaultValue?: string;
  constraints: Constraint[];
  comment?: string;

  dbSpecific: {
    mysql?: MySqlColumnConfig;
    postgresql?: PostgreSqlColumnConfig;
    sqlite?: SqliteColumnConfig;
  };
}

export interface IndexDefinition {
  id: string;
  name: string;
  type: IndexType;
  columns: string[]; // ID колонок
  unique: boolean;

  dbSpecific: {
    mysql?: MySqlIndexConfig;
    postgresql?: PostgreSqlIndexConfig;
    sqlite?: SqliteIndexConfig;
  };
}

export interface Relationship {
  id: string;
  name: string;
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  onDelete: ForeignKeyAction;
  onUpdate: ForeignKeyAction;
}

export interface TableSchema {
  id: string;
  name: string;
  comment?: string;
  columns: ColumnDefinition[];
  indexes: IndexDefinition[];
  relationships: Relationship[];
  createdAt: Date;
  updatedAt: Date;
}

// Проект - коллекция таблиц
export interface DatabaseProject {
  id: string;
  name: string;
  description?: string;
  tables: TableSchema[];
  createdAt: Date;
  updatedAt: Date;
}

// Специфичные конфигурации для СУБД
export interface MySqlColumnConfig {
  charset?: string;
  collation?: string;
  autoIncrement?: number;
  engine?: string;
}

export interface PostgreSqlColumnConfig {
  isIdentity?: boolean;
  identityGeneration?: "ALWAYS" | "BY DEFAULT";
  collation?: string;
}

export interface SqliteColumnConfig {
  autoIncrement?: boolean;
}

export interface MySqlIndexConfig {
  using?: "BTREE" | "HASH";
  comment?: string;
}

export interface PostgreSqlIndexConfig {
  using?: "BTREE" | "HASH" | "GIST" | "GIN";
  fillfactor?: number;
}

export interface SqliteIndexConfig {
  // SQLite имеет ограниченные опции для индексов
}
