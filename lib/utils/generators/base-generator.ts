import {
  TableSchema,
  ColumnDefinition,
  Relationship,
  DatabaseType,
  GenerationOptions,
  GroupByCondition,
  HavingCondition,
  JoinCondition,
  OrderByCondition,
  SelectColumn,
  SelectConfig,
  SelectGenerationOptions,
  WhereCondition,
} from "../../types";

export abstract class BaseSQLGenerator {
  abstract generateCreateTable(
    schema: TableSchema,
    options: GenerationOptions
  ): string;
  abstract generateSelect(
    config: SelectConfig,
    options?: SelectGenerationOptions
  ): string;

  protected databaseSchema?: TableSchema[];

  setDatabaseSchema(schema: TableSchema[]): void {
    this.databaseSchema = schema;
  }

  protected generateColumns(
    columns: ColumnDefinition[],
    dbType: DatabaseType
  ): string {
    return columns
      .map((column) => this.generateColumnDefinition(column, dbType))
      .join(",\n");
  }

  protected generateForeignKeys(
    relationships: Relationship[],
    dbType: DatabaseType
  ): string {
    if (relationships.length === 0) {
      return "";
    }

    const foreignKeys = relationships
      .map((relationship) =>
        this.generateForeignKeyDefinition(relationship, dbType)
      )
      .filter(Boolean);

    return foreignKeys.join(",\n");
  }

  protected abstract generateColumnDefinition(
    column: ColumnDefinition,
    dbType: DatabaseType
  ): string;
  protected abstract getDataType(
    column: ColumnDefinition,
    dbType: DatabaseType
  ): string;
  protected abstract escapeName(name: string, dbType: DatabaseType): string;
  protected abstract formatValue(value: any, dbType: DatabaseType): string;
  protected abstract escapeString(str: string, dbType: DatabaseType): string;

  protected generateForeignKeyDefinition(
    relationship: Relationship,
    dbType: DatabaseType
  ): string {
    const sourceColumnName = this.getColumnNameById(
      relationship.sourceColumnId
    );
    const targetTableName = this.getTableNameById(relationship.targetTableId);
    const targetColumnName = this.getColumnNameById(
      relationship.targetColumnId
    );

    if (!sourceColumnName || !targetTableName || !targetColumnName) {
      console.warn(
        "Пропускаем foreign key с отсутствующими именами:",
        relationship
      );
      return "";
    }

    const sourceColumn = this.escapeName(sourceColumnName, dbType);
    const targetTable = this.escapeName(targetTableName, dbType);
    const targetColumn = this.escapeName(targetColumnName, dbType);

    let sql = `  CONSTRAINT ${this.escapeName(relationship.name, dbType)}`;
    sql += ` FOREIGN KEY (${sourceColumn})`;
    sql += ` REFERENCES ${targetTable} (${targetColumn})`;
    sql += ` ON DELETE ${relationship.onDelete}`;
    sql += ` ON UPDATE ${relationship.onUpdate}`;

    return sql;
  }

  protected generateSelectColumns(
    columns: SelectColumn[],
    dbType: DatabaseType
  ): string {
    if (columns.length === 0) {
      return "*";
    }

    return columns
      .map((col) => {
        let expression: string;

        if (col.aggregateFunction && col.aggregateFunction !== "NONE") {
          const columnRef =
            col.column === "*" ? col.column : `${col.table}.${col.column}`;
          expression = `${col.aggregateFunction}(${columnRef})`;
        } else {
          expression = `${col.table}.${col.column}`;
        }

        const alias = col.aggregateAlias || col.alias;
        if (alias) {
          return `${expression} AS ${alias}`;
        }

        return expression;
      })
      .join(",\n  ");
  }

  protected generateJoins(
    joins: JoinCondition[],
    dbType: DatabaseType
  ): string {
    return joins
      .map((join) => {
        if (!join.leftColumn || !join.rightColumn) return "";

        return `${join.type} JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}`;
      })
      .filter(Boolean)
      .join("\n");
  }

  protected generateWhereConditions(
    conditions: WhereCondition[],
    dbType: DatabaseType
  ): string {
    const validConditions = conditions.filter(
      (condition) =>
        condition.column &&
        (condition.operator.includes("NULL") || condition.value !== "")
    );

    if (validConditions.length === 0) return "";

    return (
      "WHERE\n  " +
      validConditions
        .map((condition, index) => {
          const columnRef = `${condition.table}.${condition.column}`;
          let conditionStr: string;

          if (condition.operator.includes("NULL")) {
            conditionStr = `${columnRef} ${condition.operator}`;
          } else {
            conditionStr = `${columnRef} ${
              condition.operator
            } ${this.formatValue(condition.value, dbType)}`;
          }

          return `${
            index > 0 ? condition.logicalOperator + " " : ""
          }${conditionStr}`;
        })
        .join("\n  ")
    );
  }

  protected generateGroupBy(
    conditions: GroupByCondition[],
    dbType: DatabaseType
  ): string {
    const validConditions = conditions.filter((condition) => condition.column);

    if (validConditions.length === 0) return "";

    const columns = validConditions
      .map((condition) => `${condition.table}.${condition.column}`)
      .join(", ");

    return `GROUP BY ${columns}`;
  }

  protected generateHavingConditions(
    conditions: HavingCondition[],
    dbType: DatabaseType
  ): string {
    const validConditions = conditions.filter(
      (condition) => condition.column && condition.value !== ""
    );

    if (validConditions.length === 0) return "";

    return (
      "HAVING\n  " +
      validConditions
        .map((condition, index) => {
          const conditionStr = `${condition.column} ${
            condition.operator
          } ${this.formatValue(condition.value, dbType)}`;
          return `${
            index > 0 ? condition.logicalOperator + " " : ""
          }${conditionStr}`;
        })
        .join("\n  ")
    );
  }

  protected generateOrderBy(
    conditions: OrderByCondition[],
    dbType: DatabaseType
  ): string {
    const validConditions = conditions.filter((condition) => condition.column);

    if (validConditions.length === 0) return "";

    const columns = validConditions
      .map(
        (condition) =>
          `${condition.table}.${condition.column} ${condition.direction}`
      )
      .join(", ");

    return `ORDER BY ${columns}`;
  }

  protected generateLimitOffset(
    limit?: number,
    offset?: number,
    dbType?: DatabaseType
  ): string {
    let result = "";

    if (limit) {
      result += `LIMIT ${limit}`;
    }

    if (offset) {
      result += ` OFFSET ${offset}`;
    }

    return result;
  }

  private getTableNameById(tableId: string): string | undefined {
    if (!this.databaseSchema) return undefined;

    const table = this.databaseSchema.find((t) => t.id === tableId);
    return table?.name;
  }

  private getColumnNameById(columnId: string): string | undefined {
    if (!this.databaseSchema) return undefined;

    for (const table of this.databaseSchema) {
      const column = table.columns.find((col) => col.id === columnId);
      if (column) return column.name;
    }
    return undefined;
  }
}
