import "./Skeleton.css";

export type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
};

export function Skeleton({ width = "100%", height = "1rem", borderRadius = "8px", className = "" }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius,
      }}
      aria-busy="true"
      aria-label="Loading"
    />
  );
}
