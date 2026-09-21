import { useEffect } from 'react'

function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose?.()
            }
        }

        if (isOpen) {
            document.body.style.overflow = 'hidden'
            window.addEventListener('keydown', handleKeyDown)
        }

        return () => {
            document.body.style.overflow = 'unset'
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose?.()
        }
    }

    return (
        <div
            className="modal-backdrop"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
        >
            <div className={`modal-dialog ${size === 'lg' ? 'modal-dialog-lg' : ''}`}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button
                        type="button"
                        className="modal-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-body">{children}</div>

                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    )
}

export default Modal
