import { DatabaseType } from "./base";

export interface GeneratedSQL {
  sql: string;
  dbType: DatabaseType;
  warnings: string[];
  errors: string[];
  timestamp?: Date;
}

export interface MultiDBGeneratedSQL {
  mysql: GeneratedSQL;
  postgresql: GeneratedSQL;
  sqlite: GeneratedSQL;
}

export interface GenerationContext {
  includeComments: boolean;
  includeIfNotExists: boolean;
  format: boolean;
  targetVersion?: string;
}

// Опции для конкретных СУБД
export interface MySqlGenerationOptions {
  engine?: string;
  charset?: string;
  collation?: string;
}

export interface PostgreSqlGenerationOptions {
  includeSchema?: boolean;
  schemaName?: string;
}

export interface SqliteGenerationOptions {
  strictMode?: boolean;
}

export interface GenerationOptions extends GenerationContext {
  mysql?: MySqlGenerationOptions;
  postgresql?: PostgreSqlGenerationOptions;
  sqlite?: SqliteGenerationOptions;
}

export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  includeComments: true,
  includeIfNotExists: true,
  format: true,
};
