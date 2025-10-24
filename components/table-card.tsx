import { Relationship, TableSchema } from "@/lib/types";
import { ColumnRow } from "./schema/column-row";

interface TableCardProps {
  table: TableSchema;
  allTables: TableSchema[];
  relationships: Relationship[];
  onTableClick: (table: TableSchema) => void;
}

export function TableCard({
  table,
  allTables,
  relationships,
  onTableClick,
}: TableCardProps) {
  const tableRelationships = relationships.filter(
    (rel) => rel.sourceTableId === table.id || rel.targetTableId === table.id
  );

  return (
    <div
      className="bg-white border rounded-lg p-3 min-w-[250px] shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onTableClick(table)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-gray-900 text-lg">{table.name}</h4>
        </div>
        <div className="flex gap-1">
          {tableRelationships.length > 0 && (
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Связей: {tableRelationships.length}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        {table.columns.map((column) => (
          <ColumnRow
            key={column.id}
            column={column}
            table={table}
            allTables={allTables}
            relationships={relationships}
          />
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{table.data?.length || 0} строк данных</span>
          <span className="text-blue-600 hover:text-blue-800">
            Просмотреть данные →
          </span>
        </div>
      </div>
    </div>
  );
}
