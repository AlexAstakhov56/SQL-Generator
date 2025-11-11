import { QueryResult } from "@/lib/types";
import { Client } from "pg";

export class PostgreSQLTester {
  static async testQuery(sql: string): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      const client = new Client({
        host: "localhost",
        port: 5432,
        user: "postgres",
        password: "password",
        database: "test_db",
      });

      await client.connect();

      try {
        // Проверяем версию PostgreSQL
        const versionResult = await client.query("SELECT version()");
        const version = versionResult.rows[0]?.version;
        console.log("🔍 PostgreSQL Version:", version);

        // Выполняем основной запрос
        const result = await client.query(sql);

        console.log("📊 PostgreSQL Query Result:", {
          rowCount: result.rowCount,
          rows: result.rows,
          fields: result.fields?.map((f) => f.name),
        });

        return {
          success: true,
          data: result.rows, // Это массив объектов
          columns: result.fields?.map((field) => field.name) || [],
          executionTime: Date.now() - startTime,
          meta: {
            version: version,
            rowCount: result.rowCount || 0,
          },
        };
      } finally {
        await client.end();
      }
    } catch (error: any) {
      console.error("❌ PostgreSQL Error:", error);
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        sqlState: error.code,
      };
    }
  }
}
