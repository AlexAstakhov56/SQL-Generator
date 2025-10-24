import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    "font-medium rounded-lg transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-violet-500 text-white cursor-pointer hover:bg-violet-600 focus:ring-blue-300 shadow-sm",
    secondary:
      "bg-gray-200 text-gray-900 cursor-pointer hover:bg-gray-300 focus:ring-gray-300 shadow-sm",
    danger:
      "bg-red-500 text-white cursor-pointer hover:bg-red-600 focus:ring-red-300 shadow-sm",
    success:
      "bg-green-500 text-white cursor-pointer hover:bg-green-600 focus:ring-green-300 shadow-sm",
    warning:
      "bg-yellow-500 text-white cursor-pointer hover:bg-yellow-600 shadow-sm",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
