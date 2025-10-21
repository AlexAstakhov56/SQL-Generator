import {
  DatabaseType,
  MultiDBTestResult,
  TestResult,
  QueryResult,
} from "../../types";
import { SQLiteTester } from "./sqlite-tester";
import { DockerManager } from "../docker-manager";

export class QueryTester {
  private sqliteTester: SQLiteTester;
  private dockerManager: DockerManager;
  private useDocker: boolean;

  constructor(useDocker: boolean = true) {
    this.sqliteTester = new SQLiteTester();
    this.dockerManager = new DockerManager();
    this.useDocker = useDocker;
  }

  /**
   * Тестирование запроса во всех СУБД
   */
  async testQueryInAllDBs(
    queries: Record<DatabaseType, string>
  ): Promise<MultiDBTestResult> {
    const results: Partial<MultiDBTestResult> = {};

    // Всегда тестируем SQLite в браузере
    results.sqlite = await this.testSQLite(queries.sqlite);

    // MySQL и PostgreSQL тестируем через Docker если включено
    if (this.useDocker) {
      try {
        results.mysql = await this.testWithDocker("mysql", queries.mysql);
        results.postgresql = await this.testWithDocker(
          "postgresql",
          queries.postgresql
        );
      } catch (error) {
        console.warn(
          "Docker тестирование недоступно:",
          this.errorToString(error)
        );
        // Добавляем заглушки для MySQL и PostgreSQL
        results.mysql = this.createDockerUnavailableResult(
          "mysql",
          queries.mysql
        );
        results.postgresql = this.createDockerUnavailableResult(
          "postgresql",
          queries.postgresql
        );
      }
    } else {
      // Docker отключен - добавляем заглушки
      results.mysql = this.createDockerUnavailableResult(
        "mysql",
        queries.mysql
      );
      results.postgresql = this.createDockerUnavailableResult(
        "postgresql",
        queries.postgresql
      );
    }

    return {
      mysql: results.mysql!,
      postgresql: results.postgresql!,
      sqlite: results.sqlite!,
      allValid: this.checkAllValid(results),
    };
  }

  /**
   * Тестирование в одной СУБД
   */
  async testQueryInDB(
    dbType: DatabaseType,
    query: string
  ): Promise<TestResult> {
    switch (dbType) {
      case "sqlite":
        return await this.testSQLite(query);

      case "mysql":
      case "postgresql":
        if (this.useDocker) {
          return await this.testWithDocker(dbType, query);
        } else {
          return this.createDockerUnavailableResult(dbType, query);
        }

      default:
        return this.createErrorResult(dbType, query, "Неподдерживаемая СУБД");
    }
  }

  /**
   * Тестирование SQLite в браузере
   */
  private async testSQLite(query: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const result = await this.sqliteTester.testQuery(query);

      return {
        dbType: "sqlite",
        query,
        result,
        validated: result.success,
        warnings: [],
      };
    } catch (error) {
      return {
        dbType: "sqlite",
        query,
        result: {
          success: false,
          error: this.errorToString(error),
          executionTime: Date.now() - startTime,
        },
        validated: false,
        warnings: ["Ошибка тестирования SQLite"],
      };
    }
  }

  /**
   * Тестирование через Docker
   */
  private async testWithDocker(
    dbType: "mysql" | "postgresql",
    query: string
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const containerId = await this.dockerManager.createDBContainer(dbType);
      const result = await this.dockerManager.executeQuery(containerId, query);

      // Очищаем контейнер после тестирования
      await this.dockerManager.cleanupContainer(containerId);

      return {
        dbType,
        query,
        result,
        validated: result.success,
        warnings: [],
      };
    } catch (error) {
      return {
        dbType,
        query,
        result: {
          success: false,
          error: this.errorToString(error),
          executionTime: Date.now() - startTime,
        },
        validated: false,
        warnings: ["Docker контейнер недоступен"],
      };
    }
  }

  /**
   * Создание результата для случая когда Docker недоступен
   */
  private createDockerUnavailableResult(
    dbType: "mysql" | "postgresql",
    query: string
  ): TestResult {
    return {
      dbType,
      query,
      result: {
        success: false,
        error: "Docker тестирование отключено",
        executionTime: 0,
      },
      validated: false,
      warnings: ["Для тестирования MySQL/PostgreSQL включите Docker"],
    };
  }

  /**
   * Создание результата с ошибкой
   */
  private createErrorResult(
    dbType: DatabaseType,
    query: string,
    error: string
  ): TestResult {
    return {
      dbType,
      query,
      result: {
        success: false,
        error,
        executionTime: 0,
      },
      validated: false,
      warnings: [],
    };
  }

  private checkAllValid(results: Partial<MultiDBTestResult>): boolean {
    const requiredDBs: DatabaseType[] = ["mysql", "postgresql", "sqlite"];

    return requiredDBs.every((dbType) => {
      const result = results[dbType];
      return result !== undefined && result.validated === true;
    });
  }

  /**
   * Преобразование ошибки в строку
   */
  private errorToString(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Неизвестная ошибка";
  }

  /**
   * Включение/выключение Docker тестирования
   */
  setUseDocker(useDocker: boolean): void {
    this.useDocker = useDocker;
  }

  /**
   * Проверка доступности Docker
   */
  async checkDockerAvailability(): Promise<boolean> {
    if (!this.useDocker) return false;

    try {
      // Пробуем создать и сразу удалить тестовый контейнер
      const containerId = await this.dockerManager.createDBContainer("mysql");
      await this.dockerManager.cleanupContainer(containerId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Очистка ресурсов
   */
  destroy(): void {
    this.sqliteTester.destroy();
    this.dockerManager.destroy();
  }
}
