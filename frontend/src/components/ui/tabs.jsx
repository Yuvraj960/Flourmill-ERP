import * as React from "react"

const TabsContext = React.createContext({})

export function Tabs({ defaultValue, value, onValueChange, children, className }) {
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const currentValue = value !== undefined ? value : internalValue

    const changeValue = React.useCallback(
        (newValue) => {
            setInternalValue(newValue)
            if (onValueChange) {
                onValueChange(newValue)
            }
        },
        [onValueChange]
    )

    return (
        <TabsContext.Provider value={{ value: currentValue, onValueChange: changeValue }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    )
}

export function TabsList({ className = "", children }) {
    return (
        <div
            className={`inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500 ${className}`}
        >
            {children}
        </div>
    )
}

export function TabsTrigger({ value, className = "", children, disabled = false }) {
    const context = React.useContext(TabsContext)

    if (!context) {
        throw new Error("TabsTrigger must be used within a Tabs component")
    }

    const isSelected = context.value === value

    return (
        <button
            type="button"
            disabled={disabled}
            role="tab"
            aria-selected={isSelected}
            onClick={() => context.onValueChange(value)}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isSelected
                    ? "bg-white text-slate-950 shadow"
                    : "hover:bg-slate-200/50 hover:text-slate-900"
                } ${className}`}
        >
            {children}
        </button>
    )
}

export function TabsContent({ value, className = "", children }) {
    const context = React.useContext(TabsContext)

    if (!context) {
        throw new Error("TabsContent must be used within a Tabs component")
    }

    if (context.value !== value) {
        return null
    }

    return (
        <div
            role="tabpanel"
            className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 ${className}`}
        >
            {children}
        </div>
    )
}
