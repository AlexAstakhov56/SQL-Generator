"use server";
import { NextRequest, NextResponse } from "next/server";
import { SelectedDBService } from "../../../lib/services/selected-db-service";
import { DatabaseType } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { query, dbType }: { query: string; dbType: DatabaseType } =
      await request.json();

    if (!query || !dbType) {
      return NextResponse.json(
        { success: false, error: "Необходимы query и dbType" },
        { status: 400 }
      );
    }

    const dbService = await SelectedDBService.createForServer();
    const results = await dbService.testQuery(query, dbType);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
