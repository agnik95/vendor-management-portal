import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        return {
            success: (msg) => console.log('[Toast success]', msg),
            warning: (msg) => console.log('[Toast warning]', msg),
            danger: (msg) => console.log('[Toast danger]', msg),
            error: (title, msg) => console.log('[Toast error]', title, msg),
            info: (msg) => console.log('[Toast info]', msg),
        }
    }
    return context
}

export default useToast
