import { InputHTMLAttributes, useId } from "react";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, id, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id || autoId;
  const describedById = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="form-group">
      <label htmlFor={inputId}>{label}</label>
      <input
        {...props}
        id={inputId}
        className={`input ${error ? "input-error" : ""}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={describedById}
      />
      {error ? (
        <div className="field-error" id={`${inputId}-error`}>
          {error}
        </div>
      ) : hint ? (
        <div className="field-hint" id={`${inputId}-hint`}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

