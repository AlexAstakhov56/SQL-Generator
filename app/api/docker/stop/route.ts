import { NextResponse } from "next/server";
import { QueryTester } from "@/lib/utils/testing/query-tester";

export async function POST() {
  try {
    const result = await QueryTester.stopContainers();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
