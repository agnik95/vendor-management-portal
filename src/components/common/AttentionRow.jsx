function AttentionRow({
    status = 'info',
    title,
    supplier,
    meta,
    onClick,
    as = 'div',
    className = '',
    showArrow = false,
}) {
    const Component = as

    return (
        <Component
            className={`attention-row ${className}`.trim()}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <span className={`attention-indicator ${status}`} />

            <span className="attention-content">
                <strong>{title}</strong>
                <span>{supplier}</span>
                <small>{meta}</small>
            </span>

            {showArrow && <span className="row-arrow">→</span>}
        </Component>
    )
}

export default AttentionRow