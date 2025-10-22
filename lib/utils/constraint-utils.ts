import { ColumnDefinition, Constraint } from "../types";

export const constraintUtils = {
  // Добавить constraint
  addConstraint: (
    column: ColumnDefinition,
    constraint: Constraint
  ): ColumnDefinition => {
    if (column.constraints.includes(constraint)) {
      return column; // Уже существует
    }
    return {
      ...column,
      constraints: [...column.constraints, constraint],
    };
  },

  // Удалить constraint
  removeConstraint: (
    column: ColumnDefinition,
    constraint: Constraint
  ): ColumnDefinition => {
    return {
      ...column,
      constraints: column.constraints.filter((c) => c !== constraint),
    };
  },

  // Проверить наличие constraint
  hasConstraint: (
    column: ColumnDefinition,
    constraint: Constraint
  ): boolean => {
    return column.constraints.includes(constraint);
  },

  // Переключить constraint
  toggleConstraint: (
    column: ColumnDefinition,
    constraint: Constraint
  ): ColumnDefinition => {
    if (constraintUtils.hasConstraint(column, constraint)) {
      return constraintUtils.removeConstraint(column, constraint);
    } else {
      return constraintUtils.addConstraint(column, constraint);
    }
  },
};
