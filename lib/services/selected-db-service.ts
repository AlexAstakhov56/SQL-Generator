import {
  DatabaseType,
  TableSchema,
  MultiDBGeneratedSQL,
  MultiDBTestResult,
  SelectedDBTestResult,
  GenerationOptions,
} from "../types";
import { SQLGenerator } from "../utils/generators/sql-generator";
import { SQLiteTester } from "../utils/testing/sqlite-tester";
// import { DockerManager } from "../utils/docker-manager";

export class SelectedDBService {
  private sqliteTester: SQLiteTester;
  private dockerManager: any = null;

  private constructor() {
    this.sqliteTester = new SQLiteTester();
  }

  /**
   * Фабричный метод для серверного использования (с Docker)
   */
  static async createForServer(): Promise<SelectedDBService> {
    if (typeof window !== "undefined") {
      throw new Error(
        "SelectedDBService can only be created on the server side"
      );
    }

    const instance = new SelectedDBService();
    const { DockerManager } = await import("../utils/docker-manager");
    instance.dockerManager = new DockerManager();
    return instance;
  }

  /**
   * Фабричный метод для клиентского использования (только SQLite)
   */
  static createForClient(): SelectedDBService {
    const instance = new SelectedDBService();
    // DockerManager не инициализируем на клиенте
    return instance;
  }

  /**
   * Универсальный метод создания (автоматически определяет среду)
   */
  static async create(): Promise<SelectedDBService> {
    if (typeof window === "undefined") {
      return this.createForServer();
    } else {
      return this.createForClient();
    }
  }

  /**
   * Проверка доступности DockerManager
   */
  private async getDockerManager(): Promise<any> {
    if (!this.dockerManager) {
      throw new Error(
        "Docker operations are only available on the server side. Use createForServer() method."
      );
    }
    return this.dockerManager;
  }

  /**
   * Проверка поддержки СУБД
   */
  private supportsDBType(dbType: DatabaseType): boolean {
    if (dbType === "sqlite") {
      return true; // SQLite всегда доступен
    }
    return this.dockerManager !== null; // MySQL/PostgreSQL только с Docker
  }

  /**
   * Генерация SQL для выбранной СУБД
   */
  async generateSQL(
    schema: TableSchema,
    selectedDB: DatabaseType,
    options: Partial<GenerationOptions> = {}
  ): Promise<Partial<MultiDBGeneratedSQL>> {
    const result = await SQLGenerator.generateCreateTable(
      schema,
      selectedDB,
      options
    );

    return {
      [selectedDB]: result,
    };
  }

  /**
   * Тестирование запроса в выбранной СУБД
   */
  async testQuery(
    query: string,
    selectedDB: DatabaseType
  ): Promise<SelectedDBTestResult> {
    const startTime = Date.now();

    try {
      // Проверяем поддержку выбранной СУБД
      if (!this.supportsDBType(selectedDB)) {
        throw new Error(
          `Database ${selectedDB} is only available on the server side. ` +
            `Use createForServer() method to enable MySQL and PostgreSQL support.`
        );
      }

      let results: Partial<MultiDBTestResult> = {};

      results[selectedDB] = await this.testInSingleDB(selectedDB, query);

      return {
        selectedDB,
        results,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        selectedDB,
        results: {},
        executionTime: Date.now() - startTime,
        //error: this.errorToString(error),
      };
    }
  }

  /**
   * Тестирование в одной СУБД
   */
  private async testInSingleDB(dbType: DatabaseType, query: string) {
    const startTime = Date.now();

    try {
      let result;

      if (dbType === "sqlite") {
        // SQLite в браузере
        result = await this.sqliteTester.testQuery(query);
      } else {
        // MySQL/PostgreSQL в Docker
        const manager = await this.getDockerManager();
        const containerId = await manager.createDBContainer(dbType);
        result = await manager.executeQuery(containerId, query);

        // Очищаем контейнер после тестирования
        await manager.cleanupContainer(containerId);
      }

      return {
        dbType,
        query,
        result,
        validated: result.success,
        warnings: [],
        executionTime: Date.now() - startTime,
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
        warnings: ["Ошибка при тестировании"],
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Тестирование во всех доступных СУБД
   */
  async testInAllDBs(query: string): Promise<Partial<MultiDBTestResult>> {
    const results: Partial<MultiDBTestResult> = {};

    // Тестируем только в доступных СУБД
    const availableDBs = this.getAvailableDatabases()
      .filter((db) => this.supportsDBType(db.value))
      .map((db) => db.value);

    const promises = availableDBs.map(async (dbType) => {
      results[dbType] = await this.testInSingleDB(dbType, query);
    });

    await Promise.all(promises);
    return results;
  }

  private errorToString(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Неизвестная ошибка";
  }

  /**
   * Получение доступных СУБД для выбора
   */
  getAvailableDatabases(): {
    value: DatabaseType;
    label: string;
    description: string;
    available: boolean;
  }[] {
    return [
      {
        value: "mysql",
        label: "MySQL",
        description: "Самая популярная opensource СУБД",
        available: this.dockerManager !== null,
      },
      {
        value: "postgresql",
        label: "PostgreSQL",
        description: "Продвинутая opensource СУБД",
        available: this.dockerManager !== null,
      },
      {
        value: "sqlite",
        label: "SQLite",
        description: "Встроенная БД, тестирование в браузере",
        available: true, // SQLite всегда доступен
      },
    ];
  }

  /**
   * Получение информации о поддержке Docker
   */
  getDockerSupport(): { hasDocker: boolean; environment: "server" | "client" } {
    return {
      hasDocker: this.dockerManager !== null,
      environment: typeof window === "undefined" ? "server" : "client",
    };
  }
}
