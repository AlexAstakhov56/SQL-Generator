import { SQLiteTester } from "./sqlite-tester";
import { MySQLTester } from "./mysql-tester";
import { PostgreSQLTester } from "./postgresql-tester";
import { DockerManager } from "../docker-manager";
import {
  ContainerStatus,
  DatabaseType,
  QueryResult,
  TestResult,
} from "@/lib/types";

export class QueryTester {
  private static dockerManager = new DockerManager();

  static async testQuery(
    sql: string,
    dbType: DatabaseType
  ): Promise<TestResult> {
    const testResult: TestResult = {
      dbType,
      query: sql,
      result: { success: false, error: "Not executed" },
      validated: false,
      warnings: [],
    };

    try {
      switch (dbType) {
        case "sqlite":
          testResult.result = await SQLiteTester.testQuery(sql);
          break;

        case "mysql":
          // Проверяем статус MySQL контейнера
          const status = await this.dockerManager.getFixedContainersStatus();
          if (status.mysql.status !== "running") {
            testResult.result = {
              success: false,
              error: "MySQL container is not running. Please start it first.",
            };
          } else {
            testResult.result = await MySQLTester.testQuery(sql);
          }
          break;

        case "postgresql":
          const pgStatus = await this.dockerManager.getFixedContainersStatus();
          if (pgStatus.postgresql.status !== "running") {
            testResult.result = {
              success: false,
              error:
                "PostgreSQL container is not running. Please start it first.",
            };
          } else {
            testResult.result = await PostgreSQLTester.testQuery(sql);
          }
          break;

        default:
          testResult.result = {
            success: false,
            error: `Unsupported database type: ${dbType}`,
          };
      }

      // Валидация результатов
      testResult.validated = this.validateResult(testResult.result);

      // Добавляем предупреждения
      if (testResult.result.success) {
        testResult.warnings = this.generateWarnings(sql, testResult.result);
      }
    } catch (error: any) {
      testResult.result = {
        success: false,
        error: error.message,
      };
    }

    return testResult;
  }

  static async testAllDatabases(sql: string): Promise<TestResult[]> {
    const databases: DatabaseType[] = ["sqlite", "mysql", "postgresql"];
    const results: TestResult[] = [];

    for (const dbType of databases) {
      const result = await this.testQuery(sql, dbType);
      results.push(result);
    }

    return results;
  }

  static async startContainer(
    dbType: "mysql" | "postgresql"
  ): Promise<boolean> {
    return await this.dockerManager.startContainer(dbType);
  }

  static async stopContainer(dbType: "mysql" | "postgresql"): Promise<boolean> {
    return await this.dockerManager.stopContainer(dbType);
  }

  private static validateResult(result: QueryResult): boolean {
    if (!result.success) return false;
    return true;
  }

  private static generateWarnings(sql: string, result: QueryResult): string[] {
    const warnings: string[] = [];

    // Предупреждение для SELECT без LIMIT
    if (
      sql.trim().toUpperCase().startsWith("SELECT") &&
      !sql.toUpperCase().includes("LIMIT")
    ) {
      warnings.push("SELECT query without LIMIT may return large datasets");
    }

    // Предупреждение для больших результатов
    if (result.data && result.data.length > 1000) {
      warnings.push(`Large result set: ${result.data.length} rows`);
    }

    // Предупреждение для длительного выполнения
    if (result.executionTime && result.executionTime > 5000) {
      warnings.push(`Slow query: ${result.executionTime}ms`);
    }

    return warnings;
  }

  // Методы для управления Docker контейнерами
  static async startContainers(): Promise<{
    mysql: boolean;
    postgresql: boolean;
  }> {
    return await this.dockerManager.startFixedContainers();
  }

  static async stopContainers(): Promise<{
    mysql: boolean;
    postgresql: boolean;
  }> {
    return await this.dockerManager.stopFixedContainers();
  }

  static async getContainersStatus(): Promise<{
    mysql: ContainerStatus;
    postgresql: ContainerStatus;
    docker: boolean;
  }> {
    return await this.dockerManager.getFixedContainersStatus();
  }
}
