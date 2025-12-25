import { forwardRef, TextareaHTMLAttributes } from "react";

interface SettingsTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

const SettingsTextarea = forwardRef<HTMLTextAreaElement, SettingsTextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label className="settings-label">{label}</label>
        <textarea
          ref={ref}
          className={`settings-input resize-none ${
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

SettingsTextarea.displayName = "SettingsTextarea";

export default SettingsTextarea;
