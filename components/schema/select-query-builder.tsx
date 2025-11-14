"use client";

import { useState, useMemo } from "react";
import { DatabaseSchema } from "../../lib/types";
import { Button } from "../ui/button";

interface SelectQueryBuilderProps {
  schema: DatabaseSchema;
  onQueryGenerated: (sql: string) => void;
}

type AggregateFunction = "COUNT" | "MIN" | "MAX" | "SUM" | "AVG" | "NONE";

interface SelectColumn {
  table: string;
  column: string;
  alias?: string;
  aggregateFunction?: AggregateFunction;
  aggregateAlias?: string;
}

interface SelectConfig {
  selectedTables: string[];
  selectedColumns: {
    table: string;
    column: string;
    alias?: string;
    aggregateFunction?: AggregateFunction;
    aggregateAlias?: string;
  }[];
  joins: {
    id: string;
    leftTable: string;
    rightTable: string;
    leftColumn: string;
    rightColumn: string;
    type: "INNER" | "LEFT" | "RIGHT" | "FULL";
  }[];
  whereConditions: {
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
  }[];
  orderBy: {
    id: string;
    table: string;
    column: string;
    direction: "ASC" | "DESC";
  }[];
  groupBy: {
    id: string;
    table: string;
    column: string;
  }[];
  havingConditions: {
    id: string;
    column: string;
    operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN" | "BETWEEN";
    value: string;
    logicalOperator: "AND" | "OR";
  }[];
  limit?: number;
}

export function SelectQueryBuilder({
  schema,
  onQueryGenerated,
}: SelectQueryBuilderProps) {
  const [config, setConfig] = useState<SelectConfig>({
    selectedTables: [],
    selectedColumns: [],
    joins: [],
    whereConditions: [],
    orderBy: [],
    groupBy: [],
    havingConditions: [],
    limit: 100,
  });

  const availableTables = schema.tables;

  const availableColumns = useMemo(() => {
    const columns: { table: string; column: string; type: string }[] = [];
    config.selectedTables.forEach((tableName) => {
      const table = schema.tables.find((t) => t.name === tableName);
      if (table) {
        table.columns.forEach((col) => {
          columns.push({
            table: tableName,
            column: col.name,
            type: col.type,
          });
        });
      }
    });
    return columns;
  }, [config.selectedTables, schema.tables]);

  const availableGroupByColumns = useMemo(() => {
    return config.selectedColumns
      .filter(
        (col) => !col.aggregateFunction || col.aggregateFunction === "NONE"
      )
      .map((col) => ({
        table: col.table,
        column: col.column,
        fullName: `${col.table}.${col.column}`,
      }));
  }, [config.selectedColumns]);

  const getTableColumns = (tableName: string) => {
    const table = schema.tables.find((t) => t.name === tableName);
    return table ? table.columns : [];
  };

  const hasColumnNameConflicts = useMemo(() => {
    const columnNames = config.selectedColumns.map(
      (col) => col.aggregateAlias || col.alias || col.column
    );
    return new Set(columnNames).size !== columnNames.length;
  }, [config.selectedColumns]);

  const generateId = () =>
    `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const updateColumnAliases = (
    columns: {
      table: string;
      column: string;
      aggregateFunction?: AggregateFunction;
      aggregateAlias?: string;
    }[]
  ) => {
    const columnGroups: {
      [key: string]: {
        table: string;
        column: string;
        aggregateFunction?: AggregateFunction;
      }[];
    } = {};

    columns.forEach((col) => {
      const key =
        col.aggregateFunction && col.aggregateFunction !== "NONE"
          ? `${col.aggregateFunction}_${col.column}`
          : col.column;

      if (!columnGroups[key]) {
        columnGroups[key] = [];
      }
      columnGroups[key].push(col);
    });

    return columns.map((col) => {
      const key =
        col.aggregateFunction && col.aggregateFunction !== "NONE"
          ? `${col.aggregateFunction}_${col.column}`
          : col.column;

      const group = columnGroups[key];
      const needsAlias = group && group.length > 1;

      let alias: string | undefined;
      let aggregateAlias: string | undefined;

      if (col.aggregateFunction && col.aggregateFunction !== "NONE") {
        // Для агрегатных функций генерируем алиас
        aggregateAlias = needsAlias
          ? `${col.aggregateFunction.toLowerCase()}_${col.table}_${col.column}`
          : `${col.aggregateFunction.toLowerCase()}_${col.column}`;
      } else {
        // Для обычных колонок
        alias = needsAlias ? `${col.table}_${col.column}` : undefined;
      }

      return { ...col, alias, aggregateAlias };
    });
  };

  const handleTableToggle = (tableName: string) => {
    setConfig((prev) => {
      const isSelected = prev.selectedTables.includes(tableName);
      const newSelectedTables = isSelected
        ? prev.selectedTables.filter((t) => t !== tableName)
        : [...prev.selectedTables, tableName];

      const newSelectedColumns = prev.selectedColumns.filter((col) =>
        newSelectedTables.includes(col.table)
      );

      const newJoins = prev.joins.filter(
        (join) =>
          newSelectedTables.includes(join.leftTable) &&
          newSelectedTables.includes(join.rightTable)
      );

      const newWhereConditions = prev.whereConditions.filter((condition) =>
        newSelectedTables.includes(condition.table)
      );

      const newOrderBy = prev.orderBy.filter((order) =>
        newSelectedTables.includes(order.table)
      );

      const newGroupBy = prev.groupBy.filter((group) =>
        newSelectedTables.includes(group.table)
      );

      return {
        ...prev,
        selectedTables: newSelectedTables,
        selectedColumns: newSelectedColumns,
        joins: newJoins,
        whereConditions: newWhereConditions,
        orderBy: newOrderBy,
        groupBy: newGroupBy,
      };
    });
  };

  const handleColumnToggle = (table: string, column: string) => {
    setConfig((prev) => {
      const isSelected = prev.selectedColumns.some(
        (c) =>
          c.table === table &&
          c.column === column &&
          (!c.aggregateFunction || c.aggregateFunction === "NONE")
      );

      let newSelectedColumns: SelectColumn[];
      if (isSelected) {
        // Удаляем обычную колонку (без агрегатной функции)
        newSelectedColumns = prev.selectedColumns.filter(
          (c) =>
            !(
              c.table === table &&
              c.column === column &&
              (!c.aggregateFunction || c.aggregateFunction === "NONE")
            )
        );
      } else {
        // Добавляем обычную колонку
        newSelectedColumns = [
          ...prev.selectedColumns,
          {
            table,
            column,
            aggregateFunction: "NONE",
          },
        ];
      }

      const columnsWithAliases = updateColumnAliases(newSelectedColumns);
      return {
        ...prev,
        selectedColumns: columnsWithAliases,
      };
    });
  };

  const handleAddAggregateFunction = (
    table: string,
    column: string,
    func: AggregateFunction
  ) => {
    setConfig((prev) => {
      const newSelectedColumns: SelectColumn[] = [
        ...prev.selectedColumns,
        {
          table,
          column,
          aggregateFunction: func,
        },
      ];

      const columnsWithAliases = updateColumnAliases(newSelectedColumns);
      return {
        ...prev,
        selectedColumns: columnsWithAliases,
      };
    });
  };

  // Функция для обновления агрегатной функции
  const handleUpdateAggregateFunction = (
    index: number,
    func: AggregateFunction
  ) => {
    setConfig((prev) => {
      const newSelectedColumns = [...prev.selectedColumns];
      newSelectedColumns[index] = {
        ...newSelectedColumns[index],
        aggregateFunction: func,
      };

      const columnsWithAliases = updateColumnAliases(newSelectedColumns);

      return {
        ...prev,
        selectedColumns: columnsWithAliases,
      };
    });
  };

  // Функция для удаления колонки (обычной или агрегатной)
  const handleRemoveColumn = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      selectedColumns: prev.selectedColumns.filter((_, i) => i !== index),
    }));
  };

  const handleAddGroupBy = () => {
    if (availableGroupByColumns.length === 0) return;

    const firstColumn = availableGroupByColumns[0];

    setConfig((prev) => ({
      ...prev,
      groupBy: [
        ...prev.groupBy,
        {
          id: generateId(),
          table: firstColumn.table,
          column: firstColumn.column,
        },
      ],
    }));
  };

  const handleUpdateGroupBy = (id: string, field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      groupBy: prev.groupBy.map((group) =>
        group.id === id ? { ...group, [field]: value } : group
      ),
    }));
  };

  const handleRemoveGroupBy = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      groupBy: prev.groupBy.filter((group) => group.id !== id),
    }));
  };

  const handleAddHaving = () => {
    if (availableGroupByColumns.length === 0) return;

    const firstColumn = availableGroupByColumns[0];

    setConfig((prev) => ({
      ...prev,
      havingConditions: [
        ...prev.havingConditions,
        {
          id: generateId(),
          column: `${firstColumn.table}.${firstColumn.column}`,
          operator: "=",
          value: "",
          logicalOperator: "AND",
        },
      ],
    }));
  };

  const handleUpdateHaving = (id: string, field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      havingConditions: prev.havingConditions.map((condition) =>
        condition.id === id ? { ...condition, [field]: value } : condition
      ),
    }));
  };

  const handleRemoveHaving = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      havingConditions: prev.havingConditions.filter(
        (condition) => condition.id !== id
      ),
    }));
  };

  const handleAddJoin = () => {
    if (config.selectedTables.length < 2) return;

    const [leftTable, rightTable] = config.selectedTables;

    setConfig((prev) => ({
      ...prev,
      joins: [
        ...prev.joins,
        {
          id: generateId(),
          leftTable,
          rightTable,
          leftColumn: getTableColumns(leftTable)[0]?.name || "",
          rightColumn: getTableColumns(rightTable)[0]?.name || "",
          type: "INNER",
        },
      ],
    }));
  };

  const handleUpdateJoin = (id: string, field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      joins: prev.joins.map((join) =>
        join.id === id ? { ...join, [field]: value } : join
      ),
    }));
  };

  const handleRemoveJoin = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      joins: prev.joins.filter((join) => join.id !== id),
    }));
  };

  const handleAddWhere = () => {
    const firstTable = config.selectedTables[0];
    const firstColumn = getTableColumns(firstTable)[0]?.name || "";

    setConfig((prev) => ({
      ...prev,
      whereConditions: [
        ...prev.whereConditions,
        {
          id: generateId(),
          table: firstTable,
          column: firstColumn,
          operator: "=",
          value: "",
          logicalOperator: "AND",
        },
      ],
    }));
  };

  const handleUpdateWhere = (id: string, field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      whereConditions: prev.whereConditions.map((condition) =>
        condition.id === id ? { ...condition, [field]: value } : condition
      ),
    }));
  };

  const handleRemoveWhere = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      whereConditions: prev.whereConditions.filter(
        (condition) => condition.id !== id
      ),
    }));
  };

  const handleAddOrderBy = () => {
    const firstTable = config.selectedTables[0];
    const firstColumn = getTableColumns(firstTable)[0]?.name || "";

    setConfig((prev) => ({
      ...prev,
      orderBy: [
        ...prev.orderBy,
        {
          id: generateId(),
          table: firstTable,
          column: firstColumn,
          direction: "ASC",
        },
      ],
    }));
  };

  const handleUpdateOrderBy = (id: string, field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      orderBy: prev.orderBy.map((order) =>
        order.id === id ? { ...order, [field]: value } : order
      ),
    }));
  };

  const handleRemoveOrderBy = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      orderBy: prev.orderBy.filter((order) => order.id !== id),
    }));
  };

  const generateSQL = () => {
    if (config.selectedTables.length === 0) return "";

    let sql = "SELECT\n";

    if (config.selectedColumns.length === 0) {
      sql += "  *\n";
    } else {
      const columnLines = config.selectedColumns.map((col) => {
        if (col.aggregateFunction && col.aggregateFunction !== "NONE") {
          // Для агрегатных функций
          const baseExpression =
            col.column === "*"
              ? `${col.aggregateFunction}(${col.column})`
              : `${col.aggregateFunction}(${col.table}.${col.column})`;

          return col.aggregateAlias
            ? `  ${baseExpression} as ${col.aggregateAlias}`
            : `  ${baseExpression}`;
        } else {
          // Для обычных колонок
          const baseColumn = `${col.table}.${col.column}`;
          return col.alias
            ? `  ${baseColumn} as ${col.alias}`
            : `  ${baseColumn}`;
        }
      });
      sql += columnLines.join(",\n") + "\n";
    }

    sql += `FROM ${config.selectedTables[0]}\n`;

    config.joins.forEach((join) => {
      if (join.leftColumn && join.rightColumn) {
        sql += `${join.type} JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}\n`;
      }
    });

    const validWhereConditions = config.whereConditions.filter(
      (condition) =>
        condition.column &&
        (condition.operator.includes("NULL") || condition.value !== "")
    );

    if (validWhereConditions.length > 0) {
      sql += "WHERE\n";
      const whereLines = validWhereConditions.map((condition, index) => {
        const columnRef = `${condition.table}.${condition.column}`;
        let conditionStr = "";

        if (condition.operator.includes("NULL")) {
          conditionStr = `${columnRef} ${condition.operator}`;
        } else {
          conditionStr = `${columnRef} ${condition.operator} '${condition.value}'`;
        }

        return `  ${
          index > 0 ? condition.logicalOperator + " " : ""
        }${conditionStr}`;
      });

      sql += whereLines.join("\n") + "\n";
    }

    const validGroupBy = config.groupBy.filter((group) => group.column);
    if (validGroupBy.length > 0) {
      const groupByColumns = validGroupBy.map(
        (group) => `${group.table}.${group.column}`
      );
      sql += `GROUP BY ${groupByColumns.join(", ")}\n`;
    }

    const validHavingConditions = config.havingConditions.filter(
      (condition) => condition.column && condition.value !== ""
    );

    if (validHavingConditions.length > 0) {
      sql += "HAVING\n";
      const havingLines = validHavingConditions.map((condition, index) => {
        const conditionStr = `${condition.column} ${condition.operator} '${condition.value}'`;
        return `  ${
          index > 0 ? condition.logicalOperator + " " : ""
        }${conditionStr}`;
      });

      sql += havingLines.join("\n") + "\n";
    }

    const validOrderBy = config.orderBy.filter((order) => order.column);
    if (validOrderBy.length > 0) {
      sql +=
        "ORDER BY " +
        validOrderBy
          .map((order) => `${order.table}.${order.column} ${order.direction}`)
          .join(", ") +
        "\n";
    }

    if (config.limit) {
      sql += `LIMIT ${config.limit}\n`;
    }

    return sql;
  };

  const sqlQuery = generateSQL();

  const isValidQuery =
    config.selectedTables.length > 0 &&
    config.joins.every((join) => join.leftColumn && join.rightColumn);

  const sectionColors = {
    join: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
    },
    where: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
    },
    orderBy: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-800",
    },
    groupBy: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-800",
    },
    having: {
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-800",
    },
    aggregate: {
      bg: "bg-pink-50",
      border: "border-pink-200",
      text: "text-pink-800",
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-xl text-gray-900 mb-3">
              📊 Выбор таблиц
            </h3>
            <div className="space-y-2">
              {availableTables.map((table) => (
                <label key={table.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.selectedTables.includes(table.name)}
                    onChange={() => handleTableToggle(table.name)}
                    className="accent-blue-400 w-5 h-5 cursor-pointer"
                  />
                  <span className="text-lg cursor-pointer">
                    {table.name} ({table.columns.length} columns)
                  </span>
                </label>
              ))}
            </div>
          </div>

          {config.selectedTables.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium text-xl text-gray-900 mb-3">
                🎯 Выбор колонок и агрегатных функций
              </h3>
              {hasColumnNameConflicts && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-md text-yellow-800">
                  ⚠️ Обнаружены дублирующиеся имена колонок. Автоматически
                  добавлены алиасы.
                </div>
              )}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {availableColumns.map((col, index) => {
                  // Исправленная логика проверки выбранных колонок
                  const isSelectedAsRegular = config.selectedColumns.some(
                    (c) =>
                      c.table === col.table &&
                      c.column === col.column &&
                      (!c.aggregateFunction || c.aggregateFunction === "NONE")
                  );

                  return (
                    <div
                      key={index}
                      className="p-2 border border-gray-200 rounded hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isSelectedAsRegular}
                          onChange={() =>
                            handleColumnToggle(col.table, col.column)
                          }
                          className="accent-blue-400 w-5 h-5 cursor-pointer"
                        />
                        <span className="text-lg cursor-pointer font-mono flex-1">
                          {col.table}.{col.column}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({col.type})
                        </span>
                        {isSelectedAsRegular && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            выбрана
                          </span>
                        )}
                      </div>

                      {/* Кнопки для добавления агрегатных функций */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            handleAddAggregateFunction(
                              col.table,
                              col.column,
                              "COUNT"
                            )
                          }
                        >
                          COUNT
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            handleAddAggregateFunction(
                              col.table,
                              col.column,
                              "SUM"
                            )
                          }
                        >
                          SUM
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            handleAddAggregateFunction(
                              col.table,
                              col.column,
                              "AVG"
                            )
                          }
                        >
                          AVG
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            handleAddAggregateFunction(
                              col.table,
                              col.column,
                              "MIN"
                            )
                          }
                        >
                          MIN
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            handleAddAggregateFunction(
                              col.table,
                              col.column,
                              "MAX"
                            )
                          }
                        >
                          MAX
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Список выбранных колонок и агрегатных функций */}
              {config.selectedColumns.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-lg text-gray-900 mb-2">
                    Выбранные колонки и функции:
                  </h4>
                  <div className="space-y-2">
                    {config.selectedColumns.map((col, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          col.aggregateFunction &&
                          col.aggregateFunction !== "NONE"
                            ? `${sectionColors.aggregate.bg} ${sectionColors.aggregate.border}`
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-mono text-md">
                              {col.aggregateFunction &&
                              col.aggregateFunction !== "NONE" ? (
                                <>
                                  {col.aggregateFunction}({col.table}.
                                  {col.column})
                                  {col.aggregateAlias && (
                                    <span className="ml-2 text-blue-600">
                                      as {col.aggregateAlias}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  {col.table}.{col.column}
                                  {col.alias && (
                                    <span className="ml-2 text-blue-600">
                                      as {col.alias}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {col.aggregateFunction &&
                              col.aggregateFunction !== "NONE" && (
                                <select
                                  value={col.aggregateFunction}
                                  onChange={(e) =>
                                    handleUpdateAggregateFunction(
                                      index,
                                      e.target.value as AggregateFunction
                                    )
                                  }
                                  className="text-sm border rounded px-2 py-1 bg-white"
                                >
                                  <option value="COUNT">COUNT</option>
                                  <option value="SUM">SUM</option>
                                  <option value="AVG">AVG</option>
                                  <option value="MIN">MIN</option>
                                  <option value="MAX">MAX</option>
                                </select>
                              )}
                            <Button
                              onClick={() => handleRemoveColumn(index)}
                              size="sm"
                              variant="danger"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {config.selectedTables.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-xl text-gray-900">
                  🔍 WHERE условия
                </h3>
                <Button onClick={handleAddWhere} size="md">
                  + Добавить условие
                </Button>
              </div>

              {config.whereConditions.length === 0 ? (
                <div className="text-md text-gray-500 bg-gray-50 p-3 rounded text-center">
                  💡 Добавьте условия фильтрации WHERE
                </div>
              ) : (
                <div className="space-y-3">
                  {config.whereConditions.map((condition) => (
                    <div
                      key={condition.id}
                      className={`p-3 ${sectionColors.where.bg} rounded-lg border ${sectionColors.where.border}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`text-md font-medium ${sectionColors.where.text}`}
                        >
                          WHERE условие
                        </span>
                        <Button
                          onClick={() => handleRemoveWhere(condition.id)}
                          size="sm"
                          variant="danger"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-md">
                        <div className="flex items-center space-x-2">
                          <span className={sectionColors.where.text}>
                            Таблица:
                          </span>
                          <select
                            value={condition.table}
                            onChange={(e) =>
                              handleUpdateWhere(
                                condition.id,
                                "table",
                                e.target.value
                              )
                            }
                            className="flex-1 border cursor-pointer border-green-300 rounded px-2 py-1 bg-white"
                          >
                            {config.selectedTables.map((table) => (
                              <option key={table} value={table}>
                                {table}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={sectionColors.where.text}>
                            Колонка:
                          </span>
                          <select
                            value={condition.column}
                            onChange={(e) =>
                              handleUpdateWhere(
                                condition.id,
                                "column",
                                e.target.value
                              )
                            }
                            className="flex-1 border cursor-pointer border-green-300 rounded px-2 py-1 bg-white"
                          >
                            <option value="">Выберите колонку</option>
                            {getTableColumns(condition.table).map((col) => (
                              <option key={col.name} value={col.name}>
                                {col.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={sectionColors.where.text}>
                            Оператор:
                          </span>
                          <select
                            value={condition.operator}
                            onChange={(e) =>
                              handleUpdateWhere(
                                condition.id,
                                "operator",
                                e.target.value
                              )
                            }
                            className="flex-1 border cursor-pointer border-green-300 rounded px-2 py-1 bg-white"
                          >
                            <option value="=">=</option>
                            <option value="!=">!=</option>
                            <option value=">">&gt;</option>
                            <option value="<">&lt;</option>
                            <option value=">=">&gt;=</option>
                            <option value="<=">&lt;=</option>
                            <option value="LIKE">LIKE</option>
                            <option value="IN">IN</option>
                            <option value="BETWEEN">BETWEEN</option>
                            <option value="IS NULL">IS NULL</option>
                            <option value="IS NOT NULL">IS NOT NULL</option>
                          </select>
                        </div>
                        {!condition.operator.includes("NULL") && (
                          <div className="flex items-center space-x-2">
                            <span className={sectionColors.where.text}>
                              Значение:
                            </span>
                            <input
                              type="text"
                              value={condition.value}
                              onChange={(e) =>
                                handleUpdateWhere(
                                  condition.id,
                                  "value",
                                  e.target.value
                                )
                              }
                              placeholder="Введите значение..."
                              className="flex-1 border border-green-300 rounded px-2 py-1"
                            />
                          </div>
                        )}
                        {config.whereConditions.length > 1 && (
                          <div className="flex items-center space-x-2">
                            <span className={sectionColors.where.text}>
                              Логика:
                            </span>
                            <select
                              value={condition.logicalOperator}
                              onChange={(e) =>
                                handleUpdateWhere(
                                  condition.id,
                                  "logicalOperator",
                                  e.target.value
                                )
                              }
                              className="flex-1 border cursor-pointer border-green-300 rounded px-2 py-1 bg-white"
                            >
                              <option value="AND">AND</option>
                              <option value="OR">OR</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {config.selectedTables.length > 1 && (
            <div className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-xl text-gray-900">
                  🔗 JOIN условия
                </h3>
                <Button onClick={handleAddJoin} size="md">
                  + Добавить JOIN
                </Button>
              </div>

              {config.joins.length === 0 ? (
                <div className="text-md text-gray-500 bg-gray-50 p-3 rounded text-center">
                  💡 Добавьте JOIN для связи таблиц
                </div>
              ) : (
                <div className="space-y-3">
                  {config.joins.map((join) => (
                    <div
                      key={join.id}
                      className={`p-3 ${sectionColors.join.bg} rounded-lg border ${sectionColors.join.border}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`text-md font-medium ${sectionColors.join.text}`}
                        >
                          JOIN
                        </span>
                        <Button
                          onClick={() => handleRemoveJoin(join.id)}
                          size="sm"
                          variant="danger"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-md">
                        <div className="flex items-center space-x-2">
                          <span className={sectionColors.join.text}>
                            Левая таблица:
                          </span>
                          <select
                            value={join.leftTable}
                            onChange={(e) =>
                              handleUpdateJoin(
                                join.id,
                                "leftTable",
                                e.target.value
                              )
                            }
                            className="flex-1 border cursor-pointer border-blue-300 rounded px-2 py-1 bg-white"
                          >
                            {config.selectedTables.map((table) => (
                              <option key={table} value={table}>
                                {table}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={sectionColors.join.text}>
                            Колонка:
                          </span>
                          <select
                            value={join.leftColumn}
                            onChange={(e) =>
                              handleUpdateJoin(
                                join.id,
                                "leftColumn",
                                e.target.value
                              )
                            }
                            className="flex-1 border cursor-pointer border-blue-300 rounded px-2 py-1 bg-white"
                          >
                            <option value="">Выберите колонку</option>
                            {getTableColumns(join.leftTable).map((col) => (
                              <option key={col.name} value={col.name}>
                                {col.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={sectionColors.join.text}>Тип:</span>
                          <select
                            value={join.type}
                            onChange={(e) =>
                              handleUpdateJoin(join.id, "type", e.target.value)
                            }
                            className="flex-1 border cursor-pointer border-blue-300 rounded px-2 py-1 bg-white"
                          >
                            <option value="INNER">INNER JOIN</option>
                            <option value="LEFT">LEFT JOIN</option>
                            <option value="RIGHT">RIGHT JOIN</option>
                            <option value="FULL">FULL JOIN</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={sectionColors.join.text}>
                            Правая таблица:
                          </span>
                          <select
                            value={join.rightTable}
                            onChange={(e) =>
                              handleUpdateJoin(
                                join.id,
                                "rightTable",
                                e.target.value
                              )
                            }
                            className="flex-1 border cursor-pointer border-blue-300 rounded px-2 py-1 bg-white"
                          >
                            {config.selectedTables
                              .filter((t) => t !== join.leftTable)
                              .map((table) => (
                                <option key={table} value={table}>
                                  {table}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={sectionColors.join.text}>
                            Колонка:
                          </span>
                          <select
                            value={join.rightColumn}
                            onChange={(e) =>
                              handleUpdateJoin(
                                join.id,
                                "rightColumn",
                                e.target.value
                              )
                            }
                            className="flex-1 border cursor-pointer border-blue-300 rounded px-2 py-1 bg-white"
                          >
                            <option value="">Выберите колонку</option>
                            {getTableColumns(join.rightTable).map((col) => (
                              <option key={col.name} value={col.name}>
                                {col.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {(!join.leftColumn || !join.rightColumn) && (
                        <div className="mt-2 text-xs text-red-600">
                          ⚠️ Выберите колонки для условия JOIN
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {config.selectedTables.length > 0 &&
            config.selectedColumns.length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-xl text-gray-900">
                    📊 GROUP BY группировка
                  </h3>
                  <Button
                    onClick={handleAddGroupBy}
                    size="md"
                    disabled={availableGroupByColumns.length === 0}
                  >
                    + Добавить группировку
                  </Button>
                </div>

                {config.groupBy.length === 0 ? (
                  <div className="text-md text-gray-500 bg-gray-50 p-3 rounded text-center">
                    💡 Добавьте колонки для группировки данных
                  </div>
                ) : (
                  <div className="space-y-3">
                    {config.groupBy.map((group) => (
                      <div
                        key={group.id}
                        className={`p-3 ${sectionColors.groupBy.bg} rounded-lg border ${sectionColors.groupBy.border}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={`text-md font-medium ${sectionColors.groupBy.text}`}
                          >
                            Группировка
                          </span>
                          <Button
                            onClick={() => handleRemoveGroupBy(group.id)}
                            size="sm"
                            variant="danger"
                          >
                            ×
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-md">
                          <div className="flex items-center space-x-2">
                            <span className={sectionColors.groupBy.text}>
                              Колонка:
                            </span>
                            <select
                              value={`${group.table}.${group.column}`}
                              onChange={(e) => {
                                const [table, column] =
                                  e.target.value.split(".");
                                handleUpdateGroupBy(group.id, "table", table);
                                handleUpdateGroupBy(group.id, "column", column);
                              }}
                              className="flex-1 border cursor-pointer border-purple-300 rounded px-2 py-1 bg-white"
                            >
                              <option value="">Выберите колонку</option>
                              {availableGroupByColumns.map((col, index) => (
                                <option key={index} value={col.fullName}>
                                  {col.fullName}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {config.groupBy.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-xl text-gray-800">
                        🔍 HAVING условия (Только после GROUP BY)
                      </h4>
                      <Button onClick={handleAddHaving} size="sm">
                        + Добавить HAVING
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {config.havingConditions.map((condition) => (
                        <div
                          key={condition.id}
                          className={`p-3 ${sectionColors.having.bg} rounded-lg border ${sectionColors.having.border}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span
                              className={`text-md font-medium ${sectionColors.having.text}`}
                            >
                              HAVING
                            </span>
                            <Button
                              onClick={() => handleRemoveHaving(condition.id)}
                              size="sm"
                              variant="danger"
                            >
                              ×
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-2 text-md">
                            <div className="flex items-center space-x-2">
                              <span className={sectionColors.having.text}>
                                Колонка:
                              </span>
                              <select
                                value={condition.column}
                                onChange={(e) =>
                                  handleUpdateHaving(
                                    condition.id,
                                    "column",
                                    e.target.value
                                  )
                                }
                                className="flex-1 border cursor-pointer border-indigo-300 rounded px-2 py-1 bg-white"
                              >
                                <option value="">Выберите колонку</option>
                                {availableGroupByColumns.map((col, index) => (
                                  <option key={index} value={col.fullName}>
                                    {col.fullName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={sectionColors.having.text}>
                                Оператор:
                              </span>
                              <select
                                value={condition.operator}
                                onChange={(e) =>
                                  handleUpdateHaving(
                                    condition.id,
                                    "operator",
                                    e.target.value
                                  )
                                }
                                className="flex-1 border cursor-pointer border-indigo-300 rounded px-2 py-1 bg-white"
                              >
                                <option value="=">=</option>
                                <option value="!=">!=</option>
                                <option value=">">&gt;</option>
                                <option value="<">&lt;</option>
                                <option value=">=">&gt;=</option>
                                <option value="<=">&lt;=</option>
                                <option value="LIKE">LIKE</option>
                                <option value="IN">IN</option>
                                <option value="BETWEEN">BETWEEN</option>
                              </select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={sectionColors.having.text}>
                                Значение:
                              </span>
                              <input
                                type="text"
                                value={condition.value}
                                onChange={(e) =>
                                  handleUpdateHaving(
                                    condition.id,
                                    "value",
                                    e.target.value
                                  )
                                }
                                placeholder="Введите значение..."
                                className="flex-1 border border-indigo-300 rounded px-2 py-1"
                              />
                            </div>
                            {config.havingConditions.length > 1 && (
                              <div className="flex items-center space-x-2">
                                <span className={sectionColors.having.text}>
                                  Логика:
                                </span>
                                <select
                                  value={condition.logicalOperator}
                                  onChange={(e) =>
                                    handleUpdateHaving(
                                      condition.id,
                                      "logicalOperator",
                                      e.target.value
                                    )
                                  }
                                  className="flex-1 border cursor-pointer border-indigo-300 rounded px-2 py-1 bg-white"
                                >
                                  <option value="AND">AND</option>
                                  <option value="OR">OR</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {config.selectedTables.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-xl text-gray-900">
                  📈 ORDER BY сортировка
                </h3>
                <Button onClick={handleAddOrderBy} size="md">
                  + Добавить сортировку
                </Button>
              </div>

              {config.orderBy.length === 0 ? (
                <div className="text-md text-gray-500 bg-gray-50 p-3 rounded text-center">
                  💡 Добавьте правила сортировки ORDER BY
                </div>
              ) : (
                <div className="space-y-3">
                  {config.orderBy.map((order) => (
                    <div
                      key={order.id}
                      className={`p-3 ${sectionColors.orderBy.bg} rounded-lg border ${sectionColors.orderBy.border}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`text-md font-medium ${sectionColors.orderBy.text}`}
                        >
                          Сортировка
                        </span>
                        <Button
                          onClick={() => handleRemoveOrderBy(order.id)}
                          size="sm"
                          variant="danger"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-md">
                        <div className="flex items-center space-x-2">
                          <span className={sectionColors.orderBy.text}>
                            Таблица:
                          </span>
                          <select
                            value={order.table}
                            onChange={(e) =>
                              handleUpdateOrderBy(
                                order.id,
                                "table",
                                e.target.value
                              )
                            }
                            className="flex-1 border cursor-pointer border-orange-300 rounded px-2 py-1 bg-white"
                          >
                            {config.selectedTables.map((table) => (
                              <option key={table} value={table}>
                                {table}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={sectionColors.orderBy.text}>
                            Колонка:
                          </span>
                          <select
                            value={order.column}
                            onChange={(e) =>
                              handleUpdateOrderBy(
                                order.id,
                                "column",
                                e.target.value
                              )
                            }
                            className="flex-1 cursor-pointer border border-orange-300 rounded px-2 py-1 bg-white"
                          >
                            <option value="">Выберите колонку</option>
                            {getTableColumns(order.table).map((col) => (
                              <option key={col.name} value={col.name}>
                                {col.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={sectionColors.orderBy.text}>
                            Направление:
                          </span>
                          <select
                            value={order.direction}
                            onChange={(e) =>
                              handleUpdateOrderBy(
                                order.id,
                                "direction",
                                e.target.value
                              )
                            }
                            className="flex-1 border cursor-pointer border-orange-300 rounded px-2 py-1 bg-white"
                          >
                            <option value="ASC">По возрастанию (ASC)</option>
                            <option value="DESC">По убыванию (DESC)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-xl text-gray-900">
              📝 SELECT запрос
            </h3>
            <div className="flex items-center space-x-2">
              {!isValidQuery && (
                <span className="text-md text-red-600">
                  ⚠️ Исправьте ошибки
                </span>
              )}
              <Button
                onClick={() => onQueryGenerated(sqlQuery)}
                disabled={!sqlQuery.trim() || !isValidQuery}
                variant="primary"
              >
                Применить
              </Button>
            </div>
          </div>
          <pre className="bg-gray-50 p-3 rounded border text-lg overflow-x-auto max-h-96">
            {sqlQuery || "// Выберите таблицы и колонки для генерации SQL"}
          </pre>

          {!isValidQuery &&
            config.joins.some(
              (join) => !join.leftColumn || !join.rightColumn
            ) && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-md text-red-800">
                ❌ Исправьте условия JOIN: выберите колонки для связи таблиц
              </div>
            )}

          <div className="mt-4 space-y-2">
            <div className="text-md text-gray-600">Быстрые действия:</div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="md"
                variant="warning"
                onClick={() => {
                  const allColumns = availableColumns.map((col) => ({
                    table: col.table,
                    column: col.column,
                    aggregateFunction: "NONE" as AggregateFunction,
                  }));
                  const columnsWithAliases = updateColumnAliases(allColumns);
                  setConfig((prev) => ({
                    ...prev,
                    selectedColumns: columnsWithAliases,
                  }));
                }}
              >
                Выбрать все колонки
              </Button>
              <Button
                size="md"
                variant="danger"
                onClick={() => {
                  setConfig((prev) => ({
                    ...prev,
                    selectedColumns: [],
                    selectedTables: [],
                    groupBy: [],
                    joins: [],
                    havingConditions: [],
                    orderBy: [],
                    whereConditions: [],
                  }));
                }}
              >
                Очистить выбор
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
