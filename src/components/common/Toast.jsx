import { useState, useCallback } from 'react'
import { ToastContext } from './useToast'

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, tone = 'info', duration = 3500) => {
        const id = Date.now() + Math.random()
        setToasts((prev) => [...prev, { id, message, tone }])

        if (duration) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id))
            }, duration)
        }
    }, [])

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const toast = {
        success: (msg, dur) => addToast(msg, 'success', dur),
        warning: (msg, dur) => addToast(msg, 'warning', dur),
        danger: (msg, dur) => addToast(msg, 'danger', dur),
        info: (msg, dur) => addToast(msg, 'info', dur),
    }

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container" aria-live="polite">
                {toasts.map((item) => (
                    <div key={item.id} className={`toast toast-${item.tone}`}>
                        <span className="toast-message">{item.message}</span>
                        <button
                            type="button"
                            className="toast-close-btn"
                            onClick={() => removeToast(item.id)}
                            aria-label="Dismiss notification"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export default ToastProvider
