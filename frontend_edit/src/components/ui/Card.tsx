import { ReactNode } from "react";

export function Card({
  title,
  right,
  strong = false,
  children,
  className,
}: {
  title?: ReactNode;
  right?: ReactNode;
  strong?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card ${strong ? "strong" : ""} ${className || ""}`.trim()}>
      {title ? (
        <div className="card-title">
          <span>{title}</span>
          {right ? <div className="card-title-right">{right}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

