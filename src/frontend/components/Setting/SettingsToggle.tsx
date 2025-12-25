import { forwardRef, InputHTMLAttributes } from "react";

interface SettingsToggleProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

const SettingsToggle = forwardRef<HTMLInputElement, SettingsToggleProps>(
  ({ label, description, ...props }, ref) => {
    return (
      <label className="toggle-card cursor-pointer group">
        <div className="flex-1">
          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
            {label}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
        <div className="relative">
          <input
            type="checkbox"
            ref={ref}
            className="peer sr-only"
            {...props}
          />
          <div className="w-11 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors duration-200" />
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full shadow-sm peer-checked:translate-x-5 transition-transform duration-200" />
        </div>
      </label>
    );
  }
);

SettingsToggle.displayName = "SettingsToggle";

export default SettingsToggle;
