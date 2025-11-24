import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    description?: string;
    footer?: React.ReactNode;
    glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    title,
    description,
    footer,
    glass = true,
}) => {
    const baseStyles = 'rounded-xl overflow-hidden transition-all duration-200';
    const glassStyles = glass
        ? 'bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-xl'
        : 'bg-slate-800 border border-slate-700 shadow-lg';

    return (
        <div className={`${baseStyles} ${glassStyles} ${className}`}>
            {(title || description) && (
                <div className="px-6 py-4 border-b border-slate-700/50">
                    {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                    {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
            {footer && (
                <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-700/50">
                    {footer}
                </div>
            )}
        </div>
    );
};
