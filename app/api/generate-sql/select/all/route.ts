import { SelectConfig, SelectGenerationOptions } from "@/lib/types";
import { SQLGenerator } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      config,
      options = {},
    }: {
      config: SelectConfig;
      options?: SelectGenerationOptions;
    } = body;

    if (!config) {
      return NextResponse.json(
        { error: "Отсутствует конфигурация SELECT запроса" },
        { status: 400 }
      );
    }

    if (!config.selectedTables || config.selectedTables.length === 0) {
      return NextResponse.json(
        { error: "Не выбраны таблицы для запроса" },
        { status: 400 }
      );
    }

    const result = SQLGenerator.generateSelectForAllDBs(config, options);

    return NextResponse.json({
      success: true,
      sql: result,
      warnings: [],
      errors: [],
    });
  } catch (error) {
    console.error("Ошибка генерации SELECT запросов для всех СУБД:", error);
    return NextResponse.json(
      {
        error: "Внутренняя ошибка сервера",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
