import { InputHTMLAttributes, forwardRef, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const baseInputClasses =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-gray-100 disabled:text-gray-500';

function FieldLabel({ label, required, error }: { label?: string; required?: boolean; error?: string }) {
  if (!label) return null;
  return (
    <label className="mb-1 block text-xs font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
      {error && <span className="ml-2 text-red-500">{error}</span>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldWrapperProps>(
  ({ label, error, hint, required, className, ...props }, ref) => (
    <div className="w-full">
      <FieldLabel label={label} required={required} error={error} />
      <input
        ref={ref}
        className={clsx(baseInputClasses, error && 'border-red-400', className)}
        {...props}
      />
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldWrapperProps
>(({ label, error, hint, required, className, ...props }, ref) => (
  <div className="w-full">
    <FieldLabel label={label} required={required} error={error} />
    <textarea ref={ref} className={clsx(baseInputClasses, error && 'border-red-400', className)} {...props} />
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
));
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldWrapperProps {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, className, options, placeholder, ...props }, ref) => (
    <div className="w-full">
      <FieldLabel label={label} required={required} error={error} />
      <select ref={ref} className={clsx(baseInputClasses, error && 'border-red-400', className)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  ),
);
Select.displayName = 'Select';
