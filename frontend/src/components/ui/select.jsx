import * as React from "react"
import { ChevronDown, Check } from "lucide-react"

const SelectContext = React.createContext({})

export function Select({ onValueChange, value, defaultValue, children }) {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "")
    const [isOpen, setIsOpen] = React.useState(false)

    const currentValue = value !== undefined ? value : internalValue

    const changeValue = React.useCallback(
        (newValue) => {
            setInternalValue(newValue)
            if (onValueChange) {
                onValueChange(newValue)
            }
            setIsOpen(false)
        },
        [onValueChange]
    )

    const contextValue = React.useMemo(
        () => ({
            value: currentValue,
            onValueChange: changeValue,
            isOpen,
            setIsOpen,
            displayValue: "",
        }),
        [currentValue, changeValue, isOpen]
    )

    return (
        <SelectContext.Provider value={contextValue}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    )
}

export function SelectTrigger({ className = "", children }) {
    const context = React.useContext(SelectContext)

    // Find the SelectValue component in children to get its placeholder
    let placeholder = ""
    React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectValue) {
            placeholder = child.props.placeholder
        }
    })

    return (
        <button
            type="button"
            onClick={() => context.setIsOpen(!context.isOpen)}
            className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
            <span className="truncate">{context.value ? context.value : placeholder}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    )
}

export function SelectValue({ placeholder }) {
    // This is a dummy component used to pass the placeholder
    return null
}

export function SelectContent({ className = "", children }) {
    const context = React.useContext(SelectContext)

    if (!context.isOpen) return null

    return (
        <div className="absolute z-50 mt-1 max-h-96 min-w-[8rem] w-full overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md animate-in fade-in-80">
            <div className={`p-1 ${className}`}>
                {children}
            </div>
        </div>
    )
}

export function SelectItem({ value, className = "", children }) {
    const context = React.useContext(SelectContext)
    const isSelected = context.value === value

    return (
        <div
            onClick={() => context.onValueChange(value)}
            className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {isSelected && <Check className="h-4 w-4" />}
            </span>
            {children}
        </div>
    )
}
