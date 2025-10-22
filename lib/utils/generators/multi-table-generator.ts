import { DatabaseSchema, TableSchema, DatabaseType } from "../../types";

export class MultiTableGenerator {
  static generateDatabaseSchema(
    database: DatabaseSchema,
    dbType: DatabaseType
  ): string {
    const sqlParts: string[] = [];

    // 1. Генерация CREATE TABLE для каждой таблицы
    database.tables.forEach((table) => {
      const tableSQL = this.generateTable(table, dbType, database.tables);
      sqlParts.push(tableSQL);
    });

    return sqlParts.join("\n\n");
  }

  private static generateTable(
    table: TableSchema,
    dbType: DatabaseType,
    allTables: TableSchema[]
  ): string {
    switch (dbType) {
      case "mysql":
        const { MySQLGenerator } = require("./mysql-generator");
        const mysqlGenerator = new MySQLGenerator();
        mysqlGenerator.setDatabaseSchema?.(allTables); // Передаем схему
        return mysqlGenerator.generateCreateTable(table, {
          includeIfNotExists: true,
        });

      case "postgresql":
        const { PostgreSQLGenerator } = require("./postgresql-generator");
        const postgresGenerator = new PostgreSQLGenerator();
        postgresGenerator.setDatabaseSchema?.(allTables); // Передаем схему
        return postgresGenerator.generateCreateTable(table, {
          includeIfNotExists: true,
        });

      case "sqlite":
        const { SQLiteGenerator } = require("./sqlite-generator");
        const sqliteGenerator = new SQLiteGenerator();
        sqliteGenerator.setDatabaseSchema?.(allTables);
        let sql = sqliteGenerator.generateCreateTable(table, {
          includeIfNotExists: true,
        });

        // Добавляем включение foreign keys для SQLite
        if (table.relationships.length > 0) {
          sql = sqliteGenerator.generateEnableForeignKeys() + "\n\n" + sql;
        }

        return sql;

      default:
        throw new Error(`Unsupported DB: ${dbType}`);
    }
  }

  // private static generateForeignKeysAlterTable(
  //   database: DatabaseSchema,
  //   dbType: DatabaseType
  // ): string {
  //   // Если foreign keys уже генерируются в CREATE TABLE, этот метод можно оставить пустым
  //   // Или использовать для дополнительных constraints
  //   return "";
  // }

  private static escapeIdentifier(name: string, dbType: DatabaseType): string {
    if (!name) return "";

    switch (dbType) {
      case "mysql":
        return `\`${name.replace(/`/g, "``")}\``;
      case "postgresql":
        return `"${name.replace(/"/g, '""')}"`;
      case "sqlite":
        return `"${name.replace(/"/g, '""')}"`;
      default:
        return name;
    }
  }
}
