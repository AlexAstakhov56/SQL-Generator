import Docker from "dockerode";
import {
  DatabaseType,
  ContainerStatus,
  DockerConfig,
  QueryResult,
} from "../types";
import { ConnectionChecker } from "./testing/connection-checker";

if (typeof window !== "undefined") {
  throw new Error("DockerManager can only be used on the server side");
}

export class DockerManager {
  private docker: Docker;
  private activeContainers: Map<string, ContainerInfo> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private defaultConfig: DockerConfig = {
    memoryLimit: "256m",
    cpuLimit: "0.5",
    networkMode: "bridge",
    autoRemove: true,
    timeout: 30000,
  };

  constructor() {
    this.docker = new Docker();
    this.cleanupInterval = setInterval(
      () => this.cleanupOldContainers(),
      5 * 60 * 1000
    );
  }

  /**
   * Создание тестового контейнера для СУБД
   */
  async createDBContainer(
    dbType: DatabaseType,
    config: Partial<DockerConfig> = {}
  ): Promise<string> {
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      const containerConfig = this.getContainerConfig(dbType, finalConfig);
      const container = await this.docker.createContainer(containerConfig);

      await container.start();

      const containerInfo: ContainerInfo = {
        container,
        dbType,
        createdAt: new Date(),
        status: "starting",
        config: finalConfig,
      };

      this.activeContainers.set(container.id, containerInfo);

      // Ждем пока БД запустится
      await this.waitForDBReady(container.id, dbType);

      containerInfo.status = "running";

      return container.id;
    } catch (error) {
      throw new Error(
        `Не удалось создать контейнер ${dbType}: ${this.errorToString(error)}`
      );
    }
  }

  /**
   * Выполнение SQL запроса в контейнере
   */
  async executeQuery(containerId: string, query: string): Promise<QueryResult> {
    const containerInfo = this.activeContainers.get(containerId);
    if (!containerInfo) {
      return {
        success: false,
        error: "Контейнер не найден",
        executionTime: 0,
      };
    }

    const startTime = Date.now();

    try {
      switch (containerInfo.dbType) {
        case "mysql":
          return await this.executeMySQLQuery(containerInfo, query);
        case "postgresql":
          return await this.executePostgreSQLQuery(containerInfo, query);
        default:
          return {
            success: false,
            error: `Неподдерживаемая СУБД: ${containerInfo.dbType}`,
            executionTime: Date.now() - startTime,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: this.errorToString(error),
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Получение статуса контейнера
   */
  async getContainerStatus(containerId: string): Promise<ContainerStatus> {
    const containerInfo = this.activeContainers.get(containerId);
    if (!containerInfo) {
      return {
        id: containerId,
        dbType: "mysql", // значение по умолчанию
        status: "error",
        error: "Контейнер не найден",
      };
    }

    try {
      const info = await containerInfo.container.inspect();
      const startedAt = new Date(info.State.StartedAt);
      const uptime = Date.now() - startedAt.getTime();

      // Получаем статистику использования ресурсов
      const stats = await this.getContainerStats(containerId);

      return {
        id: containerId,
        dbType: containerInfo.dbType,
        status: info.State.Running ? "running" : "stopped",
        startedAt,
        uptime,
        resources: stats,
      };
    } catch (error) {
      return {
        id: containerId,
        dbType: containerInfo.dbType,
        status: "error",
        error: this.errorToString(error),
      };
    }
  }

  /**
   * Получение статистики использования ресурсов контейнера
   */
  private async getContainerStats(
    containerId: string
  ): Promise<{ memory: string; cpu: string }> {
    try {
      const containerInfo = this.activeContainers.get(containerId);
      if (!containerInfo) {
        return { memory: "N/A", cpu: "N/A" };
      }

      const stats = await containerInfo.container.stats({ stream: false });

      // Парсим статистику использования памяти
      const memoryUsage = this.parseMemoryStats(stats);

      // Парсим статистику использования CPU
      const cpuUsage = this.parseCPUStats(stats);

      return {
        memory: memoryUsage,
        cpu: cpuUsage,
      };
    } catch (error) {
      console.warn(
        "Не удалось получить статистику контейнера:",
        this.errorToString(error)
      );
      return { memory: "N/A", cpu: "N/A" };
    }
  }

  /**
   * Парсинг статистики использования памяти
   */
  private parseMemoryStats(stats: any): string {
    try {
      // Docker stats возвращает использование памяти в bytes
      const memoryBytes = stats.memory_stats?.usage || 0;
      const memoryLimit = stats.memory_stats?.limit || 0;

      if (memoryBytes === 0) {
        return "0 MB";
      }

      const memoryMB = memoryBytes / (1024 * 1024);
      const memoryLimitMB = memoryLimit / (1024 * 1024);

      if (memoryLimitMB > 0) {
        const usagePercent = ((memoryMB / memoryLimitMB) * 100).toFixed(1);
        return `${memoryMB.toFixed(1)} MB (${usagePercent}%)`;
      }

      return `${memoryMB.toFixed(1)} MB`;
    } catch (error) {
      return "N/A";
    }
  }

  /**
   * Парсинг статистики использования CPU
   */
  private parseCPUStats(stats: any): string {
    try {
      const cpuStats = stats.cpu_stats;
      const precpuStats = stats.precpu_stats;

      if (!cpuStats || !precpuStats) {
        return "0%";
      }

      // Расчет использования CPU по формуле Docker
      const cpuDelta =
        cpuStats.cpu_usage.total_usage - precpuStats.cpu_usage.total_usage;
      const systemDelta =
        cpuStats.system_cpu_usage - precpuStats.system_cpu_usage;
      const numberOfCpus = cpuStats.online_cpus || 1;

      if (systemDelta > 0 && cpuDelta > 0) {
        const cpuUsage = (cpuDelta / systemDelta) * numberOfCpus * 100;
        return `${cpuUsage.toFixed(1)}%`;
      }

      return "0%";
    } catch (error) {
      return "N/A";
    }
  }

  /**
   * Остановка и удаление контейнера
   */
  async cleanupContainer(containerId: string): Promise<void> {
    const containerInfo = this.activeContainers.get(containerId);
    if (!containerInfo) return;

    try {
      await containerInfo.container.stop();
      this.activeContainers.delete(containerId);
    } catch (error) {
      console.warn(
        `Ошибка при остановке контейнера ${containerId}:`,
        this.errorToString(error)
      );
      // Пытаемся удалить даже если остановка не удалась
      try {
        await containerInfo.container.remove({ force: true });
        this.activeContainers.delete(containerId);
      } catch (removeError) {
        console.error(
          `Не удалось удалить контейнер ${containerId}:`,
          this.errorToString(removeError)
        );
      }
    }
  }

  /**
   * Получение списка активных контейнеров
   */
  getActiveContainers(): Map<string, ContainerInfo> {
    return new Map(this.activeContainers);
  }

  /**
   * Остановка всех контейнеров
   */
  async cleanupAllContainers(): Promise<void> {
    const containerIds = Array.from(this.activeContainers.keys());

    for (const containerId of containerIds) {
      await this.cleanupContainer(containerId);
    }
  }

  /**
   * Преобразование ошибки в строку
   */
  private errorToString(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    } else if (typeof error === "string") {
      return error;
    } else if (error && typeof error === "object" && "message" in error) {
      return String((error as any).message);
    } else {
      return "Неизвестная ошибка";
    }
  }

  /**
   * Получение конфигурации контейнера для СУБД
   */
  private getContainerConfig(dbType: DatabaseType, config: DockerConfig) {
    const baseConfig = {
      HostConfig: {
        Memory: this.parseMemory(config.memoryLimit),
        NanoCpus: this.parseCPU(config.cpuLimit) * 1e9,
        AutoRemove: config.autoRemove,
        NetworkMode: config.networkMode,
      },
    };

    switch (dbType) {
      case "mysql":
        return {
          ...baseConfig,
          Image: "mysql:8.0",
          Env: [
            "MYSQL_ROOT_PASSWORD=test",
            "MYSQL_DATABASE=test_sandbox",
            "MYSQL_USER=test",
            "MYSQL_PASSWORD=test",
          ],
          HealthCheck: {
            Test: ["CMD", "mysqladmin", "ping", "-h", "localhost"],
            Interval: 1000000000, // 1 секунда в наносекундах
            Timeout: 3000000000, // 3 секунды
            Retries: 5,
          },
        };

      case "postgresql":
        return {
          ...baseConfig,
          Image: "postgres:13",
          Env: [
            "POSTGRES_DB=test_sandbox",
            "POSTGRES_USER=test",
            "POSTGRES_PASSWORD=test",
          ],
          HealthCheck: {
            Test: ["CMD-SHELL", "pg_isready -U test -d test_sandbox"],
            Interval: 1000000000,
            Timeout: 3000000000,
            Retries: 5,
          },
        };

      default:
        throw new Error(`Неподдерживаемая СУБД: ${dbType}`);
    }
  }

  /**
   * Запуск отдельного контейнера
   */
  async startContainer(dbType: "mysql" | "postgresql"): Promise<boolean> {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      const composeFile =
        dbType === "mysql"
          ? "docker-compose.mysql.yml"
          : "docker-compose.postgresql.yml";

      await execAsync(`docker-compose -f docker/${composeFile} up -d`);

      console.log(`${dbType} container started`);
      return true;
    } catch (error) {
      console.error(`Failed to start ${dbType}:`, error);
      return false;
    }
  }

  /**
   * Остановка отдельного контейнера
   */
  async stopContainer(dbType: "mysql" | "postgresql"): Promise<boolean> {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      const composeFile =
        dbType === "mysql"
          ? "docker-compose.mysql.yml"
          : "docker-compose.postgresql.yml";

      await execAsync(`docker-compose -f docker/${composeFile} down`);

      console.log(`${dbType} container stopped`);
      return true;
    } catch (error) {
      console.error(`Failed to stop ${dbType}:`, error);
      return false;
    }
  }

  async startFixedContainers(): Promise<{
    mysql: boolean;
    postgresql: boolean;
  }> {
    try {
      // Проверяем, запущен ли уже Docker
      const isDockerRunning = await this.isDockerRunning();
      if (!isDockerRunning) {
        throw new Error("Docker daemon is not running");
      }

      const results = {
        mysql: false,
        postgresql: false,
      };

      // Запускаем MySQL через docker-compose
      try {
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);

        await execAsync(
          "docker-compose -f docker/docker-compose.mysql.yml up -d"
        );
        results.mysql = true;
        console.log("MySQL container started");
      } catch (error) {
        console.error("Failed to start MySQL:", error);
      }

      // Запускаем PostgreSQL через docker-compose
      try {
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);

        await execAsync(
          "docker-compose -f docker/docker-compose.postgresql.yml up -d"
        );
        results.postgresql = true;
        console.log("PostgreSQL container started");
      } catch (error) {
        console.error("Failed to start PostgreSQL:", error);
      }

      return results;
    } catch (error) {
      console.error("Error starting fixed containers:", error);
      return { mysql: false, postgresql: false };
    }
  }

  /**
   * Остановка фиксированных контейнеров
   */
  async stopFixedContainers(): Promise<{
    mysql: boolean;
    postgresql: boolean;
  }> {
    try {
      const results = {
        mysql: false,
        postgresql: false,
      };

      // Останавливаем MySQL
      try {
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);

        await execAsync(
          "docker-compose -f docker/docker-compose.mysql.yml down"
        );
        results.mysql = true;
        console.log("MySQL container stopped");
      } catch (error) {
        console.error("Failed to stop MySQL:", error);
      }

      // Останавливаем PostgreSQL
      try {
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);

        await execAsync(
          "docker-compose -f docker/docker-compose.postgresql.yml down"
        );
        results.postgresql = true;
        console.log("PostgreSQL container stopped");
      } catch (error) {
        console.error("Failed to stop PostgreSQL:", error);
      }

      return results;
    } catch (error) {
      console.error("Error stopping fixed containers:", error);
      return { mysql: false, postgresql: false };
    }
  }

  async getFixedContainersStatus(): Promise<{
    mysql: ContainerStatus;
    postgresql: ContainerStatus;
    docker: boolean;
  }> {
    try {
      const isDockerRunning = await this.isDockerRunning();

      if (!isDockerRunning) {
        return {
          mysql: {
            id: "mysql-fixed",
            dbType: "mysql",
            status: "error",
            error: "Docker not running",
          },
          postgresql: {
            id: "postgresql-fixed",
            dbType: "postgresql",
            status: "error",
            error: "Docker not running",
          },
          docker: false,
        };
      }

      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      // Базовые объекты статуса
      const baseMysqlStatus: ContainerStatus = {
        id: "mysql-fixed",
        dbType: "mysql",
        status: "stopped",
      };

      const basePostgresqlStatus: ContainerStatus = {
        id: "postgresql-fixed",
        dbType: "postgresql",
        status: "stopped",
      };

      try {
        // Проверяем контейнеры по именам
        const checkContainer = async (
          containerName: string
        ): Promise<boolean> => {
          try {
            const { stdout } = await execAsync(
              `docker ps --filter "name=${containerName}" --format "{{.Status}}"`
            );
            return stdout.trim().includes("Up");
          } catch (error) {
            return false;
          }
        };

        // Проверяем MySQL контейнер
        const isMySQLRunning = await checkContainer("sql-mysql");
        if (isMySQLRunning) {
          baseMysqlStatus.status = "running";
          baseMysqlStatus.startedAt = new Date();
          baseMysqlStatus.uptime = 0;
          baseMysqlStatus.resources = { memory: "N/A", cpu: "N/A" };
        }

        // Проверяем PostgreSQL контейнер
        const isPostgreSQLRunning = await checkContainer("sql-postgres");
        if (isPostgreSQLRunning) {
          basePostgresqlStatus.status = "running";
          basePostgresqlStatus.startedAt = new Date();
          basePostgresqlStatus.uptime = 0;
          basePostgresqlStatus.resources = { memory: "N/A", cpu: "N/A" };
        }

        // Если не нашли по именам, проверяем через docker-compose как запасной вариант
        if (!isMySQLRunning) {
          try {
            const { stdout } = await execAsync(
              "docker-compose -f docker/docker-compose.mysql.yml ps -q mysql"
            );
            if (stdout.trim()) {
              baseMysqlStatus.status = "running";
            }
          } catch (error) {
            // Игнорируем ошибки
          }
        }

        if (!isPostgreSQLRunning) {
          try {
            const { stdout } = await execAsync(
              "docker-compose -f docker/docker-compose.postgresql.yml ps -q postgresql"
            );
            if (stdout.trim()) {
              basePostgresqlStatus.status = "running";
            }
          } catch (error) {
            // Игнорируем ошибки
          }
        }
      } catch (error) {
        console.error("Error checking container status:", error);
      }

      console.log("📊 Container status:", {
        mysql: baseMysqlStatus.status,
        postgresql: basePostgresqlStatus.status,
      });

      return {
        mysql: baseMysqlStatus,
        postgresql: basePostgresqlStatus,
        docker: true,
      };
    } catch (error) {
      console.error("Error in getFixedContainersStatus:", error);
      return {
        mysql: {
          id: "mysql-fixed",
          dbType: "mysql",
          status: "error",
          error: "Check failed",
        },
        postgresql: {
          id: "postgresql-fixed",
          dbType: "postgresql",
          status: "error",
          error: "Check failed",
        },
        docker: false,
      };
    }
  }

  async waitForDBReady(
    containerId: string,
    dbType: DatabaseType,
    maxAttempts = 30
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        if (dbType === "mysql") {
          const result = await ConnectionChecker.checkMySQL();
          if (result.success) return;
        } else if (dbType === "postgresql") {
          const result = await ConnectionChecker.checkPostgreSQL();
          if (result.success) return;
        }

        if (i === maxAttempts - 1) {
          throw new Error(
            `Database didn't start within ${maxAttempts} seconds`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async isDockerRunning(): Promise<boolean> {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      await execAsync("docker info");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Выполнение MySQL запроса
   */
  private async executeMySQLQuery(
    containerInfo: ContainerInfo,
    query: string
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      // Получаем IP контейнера
      const containerData = await containerInfo.container.inspect();
      const containerIP = containerData.NetworkSettings.IPAddress;

      // Здесь будет реализация подключения к MySQL
      // Используем mysql2 или аналогичную библиотеку
      const result = await this.connectAndExecuteMySQL(containerIP, query);

      return {
        success: true,
        executionTime: Date.now() - startTime,
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: this.errorToString(error),
      };
    }
  }

  /**
   * Выполнение PostgreSQL запроса
   */
  private async executePostgreSQLQuery(
    containerInfo: ContainerInfo,
    query: string
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      const containerData = await containerInfo.container.inspect();
      const containerIP = containerData.NetworkSettings.IPAddress;

      // Реализация подключения к PostgreSQL
      const result = await this.connectAndExecutePostgreSQL(containerIP, query);

      return {
        success: true,
        executionTime: Date.now() - startTime,
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: this.errorToString(error),
      };
    }
  }

  /**
   * Очистка старых контейнеров
   */
  private async cleanupOldContainers(): Promise<void> {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 минут

    for (const [containerId, containerInfo] of this.activeContainers) {
      if (now - containerInfo.createdAt.getTime() > maxAge) {
        await this.cleanupContainer(containerId);
      }
    }
  }

  /**
   * Вспомогательные методы для парсинга ресурсов
   */
  private parseMemory(memory: string): number {
    const units: { [key: string]: number } = {
      k: 1024,
      m: 1024 * 1024,
      g: 1024 * 1024 * 1024,
    };

    const match = memory.match(/^(\d+)([kmg])?$/i);
    if (!match) return 256 * 1024 * 1024; // 256MB по умолчанию

    const value = parseInt(match[1]);
    const unit = match[2]?.toLowerCase() || "m";

    return value * (units[unit] || units.m);
  }

  private parseCPU(cpu: string): number {
    if (cpu.endsWith("m")) {
      return parseInt(cpu) / 1000;
    }
    return parseFloat(cpu) || 0.5;
  }

  /**
   * Заглушки для подключения к БД (реализуются отдельно)
   */
  private async connectAndExecuteMySQL(
    host: string,
    query: string
  ): Promise<any> {
    // Реализация с использованием mysql2
    // Возвращаем заглушку для примера
    return {
      rowsAffected: 0,
      data: [],
      columns: [],
    };
  }

  private async connectAndExecutePostgreSQL(
    host: string,
    query: string
  ): Promise<any> {
    // Реализация с использованием pg
    // Возвращаем заглушку для примера
    return {
      rowsAffected: 0,
      data: [],
      columns: [],
    };
  }

  /**
   * Деструктор для очистки ресурсов
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Очищаем все контейнеры
    this.cleanupAllContainers();
  }
}

interface ContainerInfo {
  container: Docker.Container;
  dbType: DatabaseType;
  createdAt: Date;
  status: "starting" | "running" | "stopped" | "error";
  config: DockerConfig;
}
