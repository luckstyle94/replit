import { ReactNode, HTMLAttributes } from "react";

export function Card({
  title,
  right,
  strong = false,
  children,
  className,
  ...props
}: {
  title?: ReactNode;
  right?: ReactNode;
  strong?: boolean;
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      {...props}
      className={`card ${strong ? "strong" : ""} ${className || ""}`.trim()}
    >
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

