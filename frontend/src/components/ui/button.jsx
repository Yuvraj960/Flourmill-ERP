import { forwardRef } from "react";

const variantStyles = {
    default: "bg-blue-600 text-white hover:bg-blue-700 border-transparent",
    destructive: "bg-red-600 text-white hover:bg-red-700 border-transparent",
    outline: "bg-white text-slate-700 hover:bg-slate-50 border-slate-300",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border-transparent",
    link: "bg-transparent text-blue-600 hover:underline border-transparent shadow-none px-0",
};

const sizeStyles = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 py-1 text-xs",
    lg: "h-12 px-6 py-3 text-base",
    icon: "h-10 w-10 p-0",
};

const Button = forwardRef(function Button(
    { className = "", variant = "default", size = "default", disabled, children, ...props },
    ref
) {
    return (
        <button
            ref={ref}
            disabled={disabled}
            className={[
                "inline-flex items-center justify-center rounded-md border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
                variantStyles[variant] || variantStyles.default,
                sizeStyles[size] || sizeStyles.default,
                className,
            ].join(" ")}
            {...props}
        >
            {children}
        </button>
    );
});

export { Button };
