import { DatabaseType } from "./base";
import { MultiDBTestResult } from "./testing";

export * from "./base";
export * from "./schema";
export * from "./sql-generator";
export * from "./testing";
export * from "./api";
export * from "./utils";

export {
  DATA_TYPES,
  SUPPORTED_TYPES,
  DEFAULT_CONSTRAINTS,
} from "../constants/db-types";

export interface SelectedDBTestResult {
  selectedDB: DatabaseType;
  results: Partial<MultiDBTestResult>;
  executionTime: number;
}
