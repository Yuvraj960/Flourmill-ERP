import * as React from "react"
import { X } from "lucide-react"

const DialogContext = React.createContext({})

export function Dialog({ open, onOpenChange, children }) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen

    const changeOpen = React.useCallback(
        (newOpen) => {
            if (!isControlled) {
                setInternalOpen(newOpen)
            }
            if (onOpenChange) {
                onOpenChange(newOpen)
            }
        },
        [isControlled, onOpenChange]
    )

    return (
        <DialogContext.Provider value={{ isOpen, onOpenChange: changeOpen }}>
            {children}
        </DialogContext.Provider>
    )
}

export function DialogTrigger({ asChild, children, ...props }) {
    const context = React.useContext(DialogContext)

    if (!context) {
        throw new Error("DialogTrigger must be used within a Dialog component")
    }

    // Simplified trigger logic (doesn't support true asChild polymorphism without Radix slot)
    const Comp = asChild ? React.Fragment : "button"
    const compProps = asChild ? {} : { type: "button", ...props }

    return (
        <div className="inline-block" onClick={() => context.onOpenChange(true)} {...props}>
            {children}
        </div>
    )
}

export function DialogContent({ className = "", children }) {
    const context = React.useContext(DialogContext)

    if (!context || !context.isOpen) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={() => context.onOpenChange(false)}
            />

            {/* Dialog Box */}
            <div
                role="dialog"
                className={`relative z-50 grid w-full max-w-lg gap-4 bg-white p-6 shadow-lg duration-200 sm:rounded-lg ${className}`}
            >
                {children}
                <button
                    onClick={() => context.onOpenChange(false)}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 data-[state=open]:text-slate-500"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
            </div>
        </div>
    )
}

export function DialogHeader({ className = "", children }) {
    return (
        <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>
            {children}
        </div>
    )
}

export function DialogTitle({ className = "", children }) {
    return (
        <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
            {children}
        </h2>
    )
}

export function DialogDescription({ className = "", children }) {
    return (
        <p className={`text-sm text-slate-500 ${className}`}>
            {children}
        </p>
    )
}
