// Card Components
function Card({ className = "", ...props }) {
    return (
        <div
            className={["bg-white border border-slate-200 rounded-xl shadow-sm", className].join(" ")}
            {...props}
        />
    );
}

function CardHeader({ className = "", ...props }) {
    return <div className={["flex flex-col space-y-1.5 p-6", className].join(" ")} {...props} />;
}

function CardTitle({ className = "", ...props }) {
    return (
        <h3
            className={["text-lg font-semibold text-slate-900 leading-none tracking-tight", className].join(" ")}
            {...props}
        />
    );
}

function CardDescription({ className = "", ...props }) {
    return (
        <p className={["text-sm text-slate-500", className].join(" ")} {...props} />
    );
}

function CardContent({ className = "", ...props }) {
    return <div className={["p-6 pt-0", className].join(" ")} {...props} />;
}

function CardFooter({ className = "", ...props }) {
    return (
        <div className={["flex items-center p-6 pt-0", className].join(" ")} {...props} />
    );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
