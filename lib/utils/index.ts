export { SQLGenerator } from "./generators/sql-generator";
export { MySQLGenerator } from "./generators/mysql-generator";
export { PostgreSQLGenerator } from "./generators/postgresql-generator";
export { SQLiteGenerator } from "./generators/sqlite-generator";

export { SchemaTransformer } from "./schema-transformer";

export { DockerManager } from "./docker-manager";
export { SQLiteTester } from "./testing/sqlite-tester";
export { QueryTester } from "./testing/query-tester";

export { generateTestData, formatSQL, highlightSQL } from "./data-utils";

export {
  createDefaultColumn,
  createDefaultTable,
  generateId,
  validateTableName,
  isTypeSupported,
  getDataTypeInfo,
} from "./schema-utils";
