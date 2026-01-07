import { InputHTMLAttributes, useId, useRef, useEffect } from "react";
import "./Input.css";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  hint?: string;
  error?: string;
  isValid?: boolean;
};

export function Input({ label, hint, error, id, isValid, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id || autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const describedById = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  useEffect(() => {
    if (error && inputRef.current) {
      inputRef.current.setAttribute("aria-invalid", "true");
    }
  }, [error]);

  return (
    <div className="input-wrapper">
      <label htmlFor={inputId} className="input-label">
        {label}
      </label>
      <div className="input-container">
        <input
          {...props}
          ref={inputRef}
          id={inputId}
          className={`input ${error ? "input-error" : isValid ? "input-valid" : ""}`.trim()}
          aria-invalid={Boolean(error)}
          aria-describedby={describedById}
        />
        {isValid && !error && (
          <span className="input-icon-valid" aria-hidden="true">✓</span>
        )}
        {error && (
          <span className="input-icon-error" aria-hidden="true">⚠</span>
        )}
      </div>
      {error ? (
        <div className="input-error-message" id={`${inputId}-error`} role="alert">
          {error}
        </div>
      ) : hint ? (
        <div className="input-hint" id={`${inputId}-hint`}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

