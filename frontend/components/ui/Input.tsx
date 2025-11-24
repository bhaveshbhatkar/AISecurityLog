import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode | LucideIcon;
    rightIcon?: React.ReactNode | LucideIcon;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    className = '',
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    id,
    ...props
}) => {
    const inputId = id || props.name;

    const renderIcon = (Icon: React.ReactNode | LucideIcon, className: string) => {
        if (!Icon) return null;
        if (React.isValidElement(Icon)) return <span className={className}>{Icon}</span>;
        const IconComponent = Icon as LucideIcon;
        return <IconComponent className={`w-5 h-5 ${className}`} />;
    };

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-slate-300 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {LeftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        {renderIcon(LeftIcon, "")}
                    </div>
                )}
                <input
                    id={inputId}
                    className={`
            w-full bg-slate-900/50 border rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
            transition-all duration-200
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-slate-700'}
            ${LeftIcon ? 'pl-10' : ''}
            ${RightIcon ? 'pr-10' : ''}
            ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
                    {...props}
                />
                {RightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        {renderIcon(RightIcon, "")}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-red-500 animate-fade-in">
                    {error}
                </p>
            )}
            {!error && helperText && (
                <p className="mt-1.5 text-sm text-slate-400">
                    {helperText}
                </p>
            )}
        </div>
    );
};
