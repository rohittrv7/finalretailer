import { forwardRef, SelectHTMLAttributes } from "react";

interface SettingsSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  error?: string;
  options: { value: string; label: string }[];
}

const SettingsSelect = forwardRef<HTMLSelectElement, SettingsSelectProps>(
  ({ label, required, error, options, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label className="settings-label">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        <select
          ref={ref}
          className={`settings-input ${
            error ? "border-destructive focus:ring-destructive/30" : ""
          } ${className || ""}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-destructive animate-fade-in">{error}</p>
        )}
      </div>
    );
  }
);

SettingsSelect.displayName = "SettingsSelect";

export default SettingsSelect;
