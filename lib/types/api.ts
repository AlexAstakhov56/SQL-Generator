import { DatabaseType } from "./base";
import { TableSchema } from "./schema";
import { MultiDBTestResult, ContainerStatus } from "./testing";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface CreateTableRequest {
  projectId: string;
  table: Omit<TableSchema, "id" | "createdAt" | "updatedAt">;
}

export interface UpdateTableRequest {
  table: Partial<TableSchema>;
}

export interface TestQueryRequest {
  queries: Record<DatabaseType, string>;
  projectId?: string;
  timeout?: number;
}

export interface TestQueryResponse {
  results: MultiDBTestResult;
  containerInfo: Record<DatabaseType, ContainerStatus>;
}

export type TablesResponse = ApiResponse<TableSchema[]>;
export type TableResponse = ApiResponse<TableSchema>;
export type TestResponse = ApiResponse<TestQueryResponse>;
