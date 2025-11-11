import { ContainerStatus } from "./docker-manager";
import { Button } from "../ui/button";

interface ContainerCardProps {
  title: string;
  status: ContainerStatus;
  loading: "start" | "stop" | null;
  onStart?: () => void;
  onStop?: () => void;
  startDisabled?: boolean;
  stopDisabled?: boolean;
}

export function ContainerCard({
  title,
  status,
  loading,
  onStart,
  onStop,
  startDisabled = false,
  stopDisabled = false,
}: ContainerCardProps) {
  const getStatusColor = () => {
    switch (status.status) {
      case "running":
        return "text-green-600 bg-green-50 border-green-200";
      case "stopped":
        return "text-gray-600 bg-gray-50 border-gray-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case "running":
        return "Запущен";
      case "stopped":
        return "Остановлен";
      case "error":
        return "Ошибка";
      default:
        return "Неизвестно";
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case "running":
        return "🟢";
      case "stopped":
        return "⚫";
      case "error":
        return "🔴";
      default:
        return "⚫";
    }
  };

  const isLoading = loading !== null;

  return (
    <div className={`border rounded-lg p-4 ${isLoading ? "opacity-70" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}
        >
          {getStatusIcon()} {getStatusText()}
        </span>
      </div>

      {status.error && (
        <p className="text-xs text-red-600 mb-3">{status.error}</p>
      )}

      {/* Кнопки управления контейнером */}
      <div className="flex gap-2">
        <Button
          onClick={onStart}
          disabled={startDisabled || isLoading}
          variant="success"
          size="sm"
          className="flex-1"
        >
          {loading === "start" ? (
            <>
              <span className="animate-spin mr-1">⏳</span>
              Запуск...
            </>
          ) : (
            "▶️ Запустить"
          )}
        </Button>

        <Button
          onClick={onStop}
          disabled={stopDisabled || isLoading}
          variant="danger"
          size="sm"
          className="flex-1"
        >
          {loading === "stop" ? (
            <>
              <span className="animate-spin mr-1">⏳</span>
              Остановка...
            </>
          ) : (
            "⏹️ Остановить"
          )}
        </Button>
      </div>

      {/* Дополнительная информация о состоянии */}
      {status.status === "running" && (
        <div className="mt-2 text-xs text-green-600">
          ✅ Готов к тестированию
        </div>
      )}

      {status.status === "stopped" && (
        <div className="mt-2 text-xs text-gray-500">
          💡 Остановлен. Запустите для тестирования.
        </div>
      )}

      {status.status === "error" && (
        <div className="mt-2 text-xs text-red-500">
          ⚠️ Требуется вмешательство
        </div>
      )}
    </div>
  );
}
