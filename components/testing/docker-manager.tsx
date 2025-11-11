"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ContainerCard } from "./container-card";

export interface ContainerStatus {
  status: "running" | "stopped" | "error";
  error?: string;
}

interface DockerStatus {
  mysql: ContainerStatus;
  postgresql: ContainerStatus;
  docker: boolean;
}

export function DockerManager() {
  const [status, setStatus] = useState<DockerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/docker/containers");
      const data = await response.json();

      // Преобразуем данные к UI типу
      const uiStatus: DockerStatus = {
        docker: data.docker,
        mysql: {
          status: data.mysql.status,
          error: data.mysql.error,
        },
        postgresql: {
          status: data.postgresql.status,
          error: data.postgresql.error,
        },
      };

      setStatus(uiStatus);
    } catch (error) {
      console.error("Failed to load Docker status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleContainerAction = async (
    action: "start" | "stop",
    dbType?: "mysql" | "postgresql"
  ) => {
    const actionId = dbType ? `${action}-${dbType}` : action;
    setActionLoading(actionId);

    try {
      let endpoint = "";
      let body = {};

      if (dbType) {
        endpoint = `/api/docker/${dbType}`;
        body = { action };
      } else {
        endpoint = `/api/docker/${action}`;
        body = {};
      }

      console.log(`🚀 Making request to: ${endpoint}`, body);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ ${action} action successful:`, result);

      // Первое обновление через 1 секунду
      setTimeout(async () => {
        console.log("🔄 First status update...");
        await loadStatus();

        // Второе обновление через 3 секунды (после полного запуска БД)
        setTimeout(async () => {
          console.log("🔄 Second status update...");
          await loadStatus();

          // Третье обновление через 5 секунд
          setTimeout(async () => {
            console.log("🔄 Third status update...");
            await loadStatus();
          }, 2000);
        }, 2000);
      }, 1000);
    } catch (error) {
      console.error("❌ Failed to execute container action:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const isActionLoading = (
    dbType: "mysql" | "postgresql",
    action: "start" | "stop"
  ) => {
    return actionLoading === `${action}-${dbType}` || actionLoading === action;
  };

  const getContainerActionLoading = (dbType: "mysql" | "postgresql") => {
    if (actionLoading === `start-${dbType}` || actionLoading === "start")
      return "start";
    if (actionLoading === `stop-${dbType}` || actionLoading === "stop")
      return "stop";
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="text-center text-gray-500">
          Не удалось загрузить статус Docker
        </div>
      </div>
    );
  }

  if (!status.docker) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Docker не запущен</div>
          <p className="text-gray-600 mb-4">
            Для тестирования MySQL и PostgreSQL необходимо установить и
            запустить Docker Desktop
          </p>
          <Button onClick={loadStatus} variant="primary">
            Проверить снова
          </Button>
        </div>
      </div>
    );
  }

  const allRunning =
    status.mysql.status === "running" && status.postgresql.status === "running";
  const allStopped =
    status.mysql.status === "stopped" && status.postgresql.status === "stopped";

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        🐳 Управление Docker контейнерами
      </h3>

      {/* Статус контейнеров */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ContainerCard
          title="MySQL"
          status={status.mysql}
          loading={getContainerActionLoading("mysql")}
          onStart={() => handleContainerAction("start", "mysql")}
          onStop={() => handleContainerAction("stop", "mysql")}
          startDisabled={
            isActionLoading("mysql", "stop") ||
            status.mysql.status === "running"
          }
          stopDisabled={
            isActionLoading("mysql", "start") ||
            status.mysql.status === "stopped"
          }
        />
        <ContainerCard
          title="PostgreSQL"
          status={status.postgresql}
          loading={getContainerActionLoading("postgresql")}
          onStart={() => handleContainerAction("start", "postgresql")}
          onStop={() => handleContainerAction("stop", "postgresql")}
          startDisabled={
            isActionLoading("postgresql", "stop") ||
            status.postgresql.status === "running"
          }
          stopDisabled={
            isActionLoading("postgresql", "start") ||
            status.postgresql.status === "stopped"
          }
        />
      </div>

      {/* Кнопки управления всеми контейнерами */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Button
          onClick={() => handleContainerAction("start")}
          disabled={allRunning || actionLoading !== null}
          variant="success"
        >
          {actionLoading === "start" ? "⏳ Запуск..." : "▶️ Запустить все"}
        </Button>

        <Button
          onClick={() => handleContainerAction("stop")}
          disabled={allStopped || actionLoading !== null}
          variant="danger"
        >
          {actionLoading === "stop" ? "⏳ Остановка..." : "⏹️ Остановить все"}
        </Button>

        <Button
          onClick={loadStatus}
          variant="secondary"
          disabled={actionLoading !== null}
        >
          🔄 Обновить статус
        </Button>
      </div>

      {/* Информация о состоянии */}
      <div className="space-y-2">
        {allRunning && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Все контейнеры запущены и готовы к тестированию.
            </p>
          </div>
        )}

        {allStopped && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 Контейнеры остановлены. Запустите их для тестирования MySQL и
              PostgreSQL запросов.
            </p>
          </div>
        )}

        {(status.mysql.status === "error" ||
          status.postgresql.status === "error") && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              ⚠️ Возникли ошибки с контейнерами. Попробуйте перезапустить их или
              проверьте логи Docker.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
