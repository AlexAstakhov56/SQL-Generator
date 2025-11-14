export type AggregateFunction =
  | "COUNT"
  | "MIN"
  | "MAX"
  | "SUM"
  | "AVG"
  | "NONE";

export interface SelectColumn {
  table: string;
  column: string;
  alias?: string;
  aggregateFunction?: AggregateFunction;
  aggregateAlias?: string;
}

export interface JoinCondition {
  id: string;
  leftTable: string;
  rightTable: string;
  leftColumn: string;
  rightColumn: string;
  type: "INNER" | "LEFT" | "RIGHT" | "FULL";
}

export interface WhereCondition {
  id: string;
  table: string;
  column: string;
  operator:
    | "="
    | "!="
    | ">"
    | "<"
    | ">="
    | "<="
    | "LIKE"
    | "IN"
    | "BETWEEN"
    | "IS NULL"
    | "IS NOT NULL";
  value: string;
  logicalOperator: "AND" | "OR";
}

export interface OrderByCondition {
  id: string;
  table: string;
  column: string;
  direction: "ASC" | "DESC";
}

export interface GroupByCondition {
  id: string;
  table: string;
  column: string;
}

export interface HavingCondition {
  id: string;
  column: string;
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN" | "BETWEEN";
  value: string;
  logicalOperator: "AND" | "OR";
}

export interface SelectConfig {
  selectedTables: string[];
  selectedColumns: SelectColumn[];
  joins: JoinCondition[];
  whereConditions: WhereCondition[];
  orderBy: OrderByCondition[];
  groupBy: GroupByCondition[];
  havingConditions: HavingCondition[];
  limit?: number;
  offset?: number;
}

export interface SelectGenerationOptions {
  format?: boolean;
  includeAliases?: boolean;
}
