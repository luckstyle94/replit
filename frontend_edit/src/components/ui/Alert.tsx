import { ReactNode } from "react";

type AlertVariant = "info" | "success" | "error" | "warning";

export function Alert({
  variant = "info",
  title,
  children,
}: {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`alert ${variant}`.trim()} role={variant === "error" ? "alert" : "status"}>
      {title ? <div className="alert-title">{title}</div> : null}
      <div>{children}</div>
    </div>
  );
}

