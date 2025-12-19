import { ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const widthClass = fullWidth ? "btn-full-width" : "";

  return (
    <button
      {...props}
      className={`btn ${variantClass} ${sizeClass} ${widthClass} ${className || ""}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {!loading && leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
      <span>{children}</span>
      {!loading && rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
    </button>
  );
}

