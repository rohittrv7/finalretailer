import { forwardRef, InputHTMLAttributes } from "react";

interface SettingsInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
}

const SettingsInput = forwardRef<HTMLInputElement, SettingsInputProps>(
  ({ label, required, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label className="settings-label">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        <input
          ref={ref}
          className={`settings-input ${
            error ? "border-destructive focus:ring-destructive/30" : ""
          } ${className || ""}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive animate-fade-in">{error}</p>
        )}
      </div>
    );
  }
);

SettingsInput.displayName = "SettingsInput";

export default SettingsInput;
