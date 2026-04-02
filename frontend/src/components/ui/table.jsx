// Table Component
export function Table({ columns = [], data = [], className = "" }) {
    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="min-w-full border border-slate-200">
                <thead className="bg-slate-100">
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                className="px-4 py-2 text-left text-sm font-medium text-slate-700 border-b"
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIdx) => (
                        <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                            {columns.map((col, colIdx) => (
                                <td key={colIdx} className="px-4 py-2 text-sm text-slate-800 border-b">
                                    {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
