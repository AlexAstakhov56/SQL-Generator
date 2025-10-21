import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  cardTitle?: string | ReactNode;
}

export function Card({
  cardTitle,
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
      {...props}
    >
      {cardTitle && (
        <div className="px-6 py-4 border-b border-gray-200">
          {typeof cardTitle === "string" ? (
            <h3 className="text-lg font-semibold text-gray-900">{cardTitle}</h3>
          ) : (
            cardTitle
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
