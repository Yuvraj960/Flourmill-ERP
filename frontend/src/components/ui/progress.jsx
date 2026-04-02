function Progress({ value = 0, className = "" }) {
    const clamped = Math.min(100, Math.max(0, value));

    // Color based on level
    const barColor =
        clamped > 60
            ? "bg-green-500"
            : clamped > 30
                ? "bg-amber-500"
                : "bg-red-500";

    return (
        <div className={["relative h-2 w-full overflow-hidden rounded-full bg-slate-200", className].join(" ")}>
            <div
                className={["h-full transition-all duration-300", barColor].join(" ")}
                style={{ width: `${clamped}%` }}
            />
        </div>
    );
}

export { Progress };
