export type DatabaseType = "mysql" | "postgresql" | "sqlite";

export type DataType =
  | "INTEGER"
  | "BIGINT"
  | "SMALLINT"
  | "TINYINT"
  | "VARCHAR"
  | "TEXT"
  | "CHAR"
  | "DECIMAL"
  | "NUMERIC"
  | "FLOAT"
  | "REAL"
  | "BOOLEAN"
  | "BOOL"
  | "DATE"
  | "TIME"
  | "DATETIME"
  | "TIMESTAMP"
  | "BLOB"
  | "JSON"
  | "UUID";

export type Constraint =
  | "PRIMARY_KEY"
  | "UNIQUE"
  | "NOT_NULL"
  | "AUTO_INCREMENT"
  | "FOREIGN_KEY"
  | "CHECK"
  | "DEFAULT";

export type IndexType = "PRIMARY" | "UNIQUE" | "INDEX" | "FULLTEXT";

export type ForeignKeyAction =
  | "CASCADE"
  | "RESTRICT"
  | "SET_NULL"
  | "SET_DEFAULT"
  | "NO_ACTION";
