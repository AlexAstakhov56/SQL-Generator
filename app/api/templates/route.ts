"use server";
import { NextRequest, NextResponse } from "next/server";

const templates = [
  {
    id: "users_template",
    name: "Базовая таблица пользователей",
    description: "Стандартная структура для хранения пользователей",
    category: "users",
    schema: {
      name: "users",
      columns: [
        {
          id: "id",
          name: "id",
          type: "INTEGER",
          nullable: false,
          constraints: ["PRIMARY_KEY", "AUTO_INCREMENT"],
        },
        {
          id: "email",
          name: "email",
          type: "VARCHAR",
          length: 255,
          nullable: false,
          constraints: ["UNIQUE", "NOT_NULL"],
        },
        {
          id: "username",
          name: "username",
          type: "VARCHAR",
          length: 100,
          nullable: false,
          constraints: ["NOT_NULL"],
        },
      ],
    },
  },
  {
    id: "posts_template",
    name: "Таблица постов блога",
    description: "Структура для хранения статей блога",
    category: "blog",
    schema: {
      name: "posts",
      columns: [
        {
          id: "id",
          name: "id",
          type: "INTEGER",
          nullable: false,
          constraints: ["PRIMARY_KEY", "AUTO_INCREMENT"],
        },
        {
          id: "title",
          name: "title",
          type: "VARCHAR",
          length: 255,
          nullable: false,
          constraints: ["NOT_NULL"],
        },
        {
          id: "content",
          name: "content",
          type: "TEXT",
          nullable: true,
        },
        {
          id: "created_at",
          name: "created_at",
          type: "DATETIME",
          nullable: false,
          constraints: ["NOT_NULL"],
          defaultValue: "CURRENT_TIMESTAMP",
        },
      ],
    },
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: templates,
  });
}
