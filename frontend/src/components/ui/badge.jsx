const variantStyles = {
    default: "bg-slate-900 text-white border-transparent",
    secondary: "bg-slate-100 text-slate-900 border-transparent",
    destructive: "bg-red-100 text-red-700 border-red-200",
    outline: "bg-white text-slate-700 border-slate-300",
    success: "bg-green-100 text-green-700 border-green-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
};

function Badge({ className = "", variant = "default", ...props }) {
    return (
        <span
            className={[
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                variantStyles[variant] || variantStyles.default,
                className,
            ].join(" ")}
            {...props}
        />
    );
}

export { Badge };
