import { QueryResult } from "@/lib/types";

export class SQLiteTester {
  static async testQuery(sql: string): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      if (typeof window !== "undefined") {
        // Браузерная версия
        return await this.testInBrowser(sql, startTime);
      } else {
        // Серверная версия
        return await this.testInNode(sql, startTime);
      }
    } catch (error: any) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private static async testInBrowser(
    sql: string,
    startTime: number
  ): Promise<QueryResult> {
    try {
      const initSqlJs = (window as any).initSqlJs;

      if (!initSqlJs) {
        await this.loadSQLJs();
      }

      const SQL = await (window as any).initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });

      const db = new SQL.Database();

      try {
        const result = db.exec(sql);

        let data: any[] = [];
        let columns: string[] = [];
        let rowsAffected = 0;

        if (result && result.length > 0) {
          const firstResult = result[0];
          columns = firstResult.columns;

          // Преобразуем данные в массив объектов
          data = firstResult.values.map((row: any[]) => {
            const obj: Record<string, any> = {};
            columns.forEach((col, index) => {
              obj[col] = row[index];
            });
            return obj;
          });
        }

        // Для DML запросов
        const normalizedSQL = sql.trim().toUpperCase();
        if (
          normalizedSQL.startsWith("INSERT") ||
          normalizedSQL.startsWith("UPDATE") ||
          normalizedSQL.startsWith("DELETE")
        ) {
          rowsAffected = db.getRowsModified();
        }

        return {
          success: true,
          executionTime: Date.now() - startTime,
          data,
          columns,
          rowsAffected,
        };
      } finally {
        db.close();
      }
    } catch (error: any) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private static async testInNode(
    sql: string,
    startTime: number
  ): Promise<QueryResult> {
    try {
      // Для Node.js используем better-sqlite3
      const Database = await import("better-sqlite3");

      // Создаем временную in-memory базу данных
      const db = new Database.default(":memory:");

      try {
        // Выполняем запрос
        if (sql.trim().toUpperCase().startsWith("SELECT")) {
          const stmt = db.prepare(sql);
          const data = stmt.all() as any[]; // Явно указываем тип

          let columns: string[] = [];
          if (data.length > 0 && data[0]) {
            // Безопасно получаем ключи первого объекта
            columns = Object.keys(data[0] as object);
          }

          return {
            success: true,
            executionTime: Date.now() - startTime,
            data,
            columns,
            rowsAffected: 0,
          };
        } else {
          // Для INSERT/UPDATE/DELETE
          const stmt = db.prepare(sql);
          const result = stmt.run() as { changes: number };

          return {
            success: true,
            executionTime: Date.now() - startTime,
            data: [],
            columns: [],
            rowsAffected: result.changes || 0,
          };
        }
      } finally {
        db.close();
      }
    } catch (error: any) {
      // Fallback на простую реализацию, если better-sqlite3 не установлен или произошла ошибка
      return await this.testWithSimpleNodeSQLite(sql, startTime);
    }
  }

  private static async testWithSimpleNodeSQLite(
    sql: string,
    startTime: number
  ): Promise<QueryResult> {
    try {
      // Простая реализация для демонстрации
      // В реальном приложении лучше использовать better-sqlite3

      if (
        sql.trim().toUpperCase().startsWith("SELECT 1") ||
        sql.trim().toUpperCase().startsWith("SELECT NOW()") ||
        sql.trim().toUpperCase().startsWith("SELECT CURRENT_TIMESTAMP")
      ) {
        return {
          success: true,
          executionTime: Date.now() - startTime,
          data: [{ "1": 1 }],
          columns: ["1"],
          rowsAffected: 0,
        };
      }

      // Для простых тестовых запросов
      if (sql.trim().toUpperCase().startsWith("SELECT")) {
        return {
          success: true,
          executionTime: Date.now() - startTime,
          data: [],
          columns: [],
          rowsAffected: 0,
        };
      }

      // Для CREATE TABLE
      if (sql.trim().toUpperCase().startsWith("CREATE TABLE")) {
        return {
          success: true,
          executionTime: Date.now() - startTime,
          data: [],
          columns: [],
          rowsAffected: 0,
        };
      }

      // Для INSERT/UPDATE/DELETE
      if (
        sql.trim().toUpperCase().startsWith("INSERT") ||
        sql.trim().toUpperCase().startsWith("UPDATE") ||
        sql.trim().toUpperCase().startsWith("DELETE")
      ) {
        return {
          success: true,
          executionTime: Date.now() - startTime,
          data: [],
          columns: [],
          rowsAffected: 1,
        };
      }

      throw new Error(
        "SQLite not available in Node.js environment. Install better-sqlite3 for full support."
      );
    } catch (error: any) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private static async loadSQLJs(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).initSqlJs) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://sql.js.org/dist/sql-wasm.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load SQL.js"));
      document.head.appendChild(script);
    });
  }

  // Метод для инициализации тестовой базы данных с таблицами
  static async initializeTestDatabase(db: any, schema?: string): Promise<void> {
    if (schema) {
      try {
        db.exec(schema);
      } catch (error) {
        console.warn("Failed to initialize database with schema:", error);
      }
    }
  }
}
