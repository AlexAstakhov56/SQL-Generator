import initSqlJs, { Database, QueryExecResult, SqlValue } from "sql.js";
import { QueryResult } from "../../types";

export class SQLiteTester {
  private db: Database | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });

      this.db = new SQL.Database();
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Не удалось инициализировать SQLite: ${error}`);
    }
  }

  async testQuery(query: string): Promise<QueryResult> {
    if (!this.db || !this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      // Разделяем запросы если их несколько
      const queries = this.splitQueries(query);
      let lastResult: QueryExecResult[] = [];
      let rowsAffected = 0;

      for (const singleQuery of queries) {
        if (!singleQuery.trim()) continue;

        if (this.isSelectQuery(singleQuery)) {
          lastResult = this.db!.exec(singleQuery);
        } else {
          this.db!.run(singleQuery);
          rowsAffected += this.db!.getRowsModified();
        }
      }

      const executionTime = Date.now() - startTime;

      if (lastResult.length > 0) {
        // Берем первый результат (обычно это результат последнего SELECT)
        const firstResult = lastResult[0];
        return {
          success: true,
          executionTime,
          rowsAffected,
          data: this.formatResult(firstResult),
          columns: firstResult.columns,
        };
      } else {
        return {
          success: true,
          executionTime,
          rowsAffected,
          data: [],
        };
      }
    } catch (error) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: this.errorToString(error),
      };
    }
  }

  async testCreateTable(query: string): Promise<QueryResult> {
    const result = await this.testQuery(query);

    if (result.success) {
      // Проверяем, что таблица действительно создалась
      const tableName = this.extractTableName(query);
      if (tableName) {
        const checkResult = await this.testQuery(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`
        );

        if (
          !checkResult.success ||
          (checkResult.data && checkResult.data.length === 0)
        ) {
          return {
            success: false,
            error: "Таблица не была создана",
            executionTime: result.executionTime,
          };
        }
      }
    }

    return result;
  }

  async resetDatabase(): Promise<void> {
    if (!this.db) return;

    try {
      // Получаем все таблицы
      const tablesResult = this.db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      if (tablesResult.length > 0) {
        const tables = tablesResult[0].values.flat() as string[];

        // Удаляем все таблицы
        for (const table of tables) {
          this.db.run(`DROP TABLE IF EXISTS ${this.escapeName(table)}`);
        }
      }
    } catch (error) {
      console.warn("Ошибка при сбросе базы данных:", error);
    }
  }

  private errorToString(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    } else if (typeof error === "string") {
      return error;
    } else {
      return "Неизвестная ошибка";
    }
  }

  private splitQueries(query: string): string[] {
    return query.split(";").filter((q) => q.trim().length > 0);
  }

  private isSelectQuery(query: string): boolean {
    return query.trim().toUpperCase().startsWith("SELECT");
  }

  private formatResult(result: {
    columns: string[];
    values: SqlValue[][];
  }): any[] {
    return result.values.map((row) => {
      const obj: any = {};
      result.columns.forEach((column, index) => {
        obj[column] = row[index];
      });
      return obj;
    });
  }

  private extractTableName(query: string): string | null {
    const match = query.match(
      /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?["']?([^"'\s(]+)["']?/i
    );
    return match ? match[1] : null;
  }

  private escapeName(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
  }

  destroy(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
  }
}
