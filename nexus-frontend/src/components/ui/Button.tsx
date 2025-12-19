import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function Button({
  variant = "primary",
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? ""
      : variant === "secondary"
      ? "secondary"
      : variant === "ghost"
      ? "ghost"
      : "danger";

  return (
    <button
      {...props}
      className={`btn ${variantClass} ${className || ""}`.trim()}
      disabled={disabled || loading}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
}

