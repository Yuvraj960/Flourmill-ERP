import { forwardRef } from "react";

const Label = forwardRef(function Label({ className = "", ...props }, ref) {
    return (
        <label
            ref={ref}
            className={["text-sm font-medium text-slate-700 leading-none", className].join(" ")}
            {...props}
        />
    );
});

export { Label };
