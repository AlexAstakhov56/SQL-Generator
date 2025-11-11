import { DatabaseType } from "./base";

export interface QueryResult {
  success: boolean;
  executionTime?: number;
  rowsAffected?: number;
  data?: any[];
  columns?: string[];
  error?: string;
  sqlState?: string;
  meta?: {
    version?: string;
    affectedRows?: number;
    rowCount?: number;
    [key: string]: any;
  };
}

// Результат тестирования для одной СУБД
export interface TestResult {
  dbType: DatabaseType;
  query: string;
  result: QueryResult;
  validated: boolean;
  warnings: string[];
}

// Результат тестирования для всех СУБД
export interface MultiDBTestResult {
  mysql: TestResult;
  postgresql: TestResult;
  sqlite: TestResult;
  allValid: boolean;
}

export interface ContainerStatus {
  id: string;
  dbType: DatabaseType;
  status: "starting" | "running" | "stopped" | "error";
  startedAt?: Date;
  uptime?: number;
  resources?: {
    memory: string;
    cpu: string;
  };
  error?: string;
}

export interface DockerConfig {
  memoryLimit: string;
  cpuLimit: string;
  networkMode: string;
  autoRemove: boolean;
  timeout: number;
}
