import { forwardRef } from "react";

const Input = forwardRef(function Input({ className = "", type = "text", ...props }, ref) {
    return (
        <input
            ref={ref}
            type={type}
            className={[
                "flex h-10 w-full text-slate-900 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                className,
            ].join(" ")}
            {...props}
        />
    );
});

export { Input };
