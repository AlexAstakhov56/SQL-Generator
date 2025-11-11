import mysql from "mysql2/promise";
import { Client } from "pg";

export class ConnectionChecker {
  static async checkMySQL(): Promise<{ success: boolean; error?: string }> {
    try {
      const connection = await mysql.createConnection({
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password",
        database: "test_db",
        connectTimeout: 5000,
      });

      await connection.execute("SELECT 1");
      await connection.end();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async checkPostgreSQL(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const client = new Client({
        host: "localhost",
        port: 5432,
        user: "postgres",
        password: "password",
        database: "test_db",
        connectionTimeoutMillis: 5000,
      });

      await client.connect();
      await client.query("SELECT 1");
      await client.end();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
