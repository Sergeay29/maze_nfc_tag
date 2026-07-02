import React from 'react';

type InputBaseProps = {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
};

type InputAsInput = InputBaseProps & React.InputHTMLAttributes<HTMLInputElement> & { as?: 'input' };
type InputAsTextarea = InputBaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement> & { as: 'textarea' };

type InputProps = InputAsInput | InputAsTextarea;

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  className = '',
  as = 'input',
  ...props
}) => {
  const fieldClass = `input-field ${icon ? 'pl-12' : ''} ${rightIcon ? 'pr-12' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-dark mb-2 font-inter">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate">
            <span className="w-5 h-5">{icon}</span>
          </div>
        )}
        {as === 'textarea' ? (
          <textarea
            className={fieldClass}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            className={fieldClass}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate">
            <span className="w-5 h-5">{rightIcon}</span>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;
