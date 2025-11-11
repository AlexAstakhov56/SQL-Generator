import { NextRequest, NextResponse } from "next/server";
import { QueryTester } from "@/lib/utils/testing/query-tester";

export async function POST(request: NextRequest) {
  try {
    const { sql, dbType } = await request.json();

    if (!sql) {
      return NextResponse.json(
        { error: "SQL query is required" },
        { status: 400 }
      );
    }

    let results;

    if (dbType) {
      const result = await QueryTester.testQuery(sql, dbType);
      results = [result];
    } else {
      return NextResponse.json(
        { error: "Either dbType or testAll must be specified" },
        { status: 400 }
      );
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
