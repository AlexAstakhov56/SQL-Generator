import { QueryResult } from "@/lib/types";
import mysql from "mysql2/promise";

export class MySQLTester {
  static async testQuery(sql: string): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      const connection = await mysql.createConnection({
        host: "localhost",
        port: 3306,
        user: "test",
        password: "test",
        database: "test_db",
      });

      try {
        // Сначала проверяем версию MySQL
        const [versionRows] = await connection.execute(
          "SELECT VERSION() as version"
        );

        // Типизируем результат
        const versionData = versionRows as any[];
        const version = versionData[0]?.version;
        console.log("🔍 MySQL Version:", version);

        // Выполняем основной запрос
        const [rows] = await connection.execute(sql);

        // Типизируем rows для получения affectedRows
        const resultRows = rows as any;

        return {
          success: true,
          data: Array.isArray(resultRows) ? resultRows : [resultRows],
          executionTime: Date.now() - startTime,
          meta: {
            version: version,
            affectedRows: resultRows.affectedRows || 0,
          },
        };
      } finally {
        await connection.end();
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        sqlState: error.code,
      };
    }
  }
}
