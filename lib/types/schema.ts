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

export interface Relationship {
  id: string;
  name: string;
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  type: "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_MANY";
  onDelete: ForeignKeyAction;
  onUpdate: ForeignKeyAction;
}

export interface TableSchema {
  id: string;
  name: string;
  comment?: string;
  columns: ColumnDefinition[];
  relationships: Relationship[];
  data?: Record<string, any>[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseSchema {
  id: string;
  name: string;
  description?: string;
  tables: TableSchema[];
  createdAt: Date;
  updatedAt: Date;
}

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
