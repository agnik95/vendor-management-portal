function MetricCard({
    label,
    value,
    detail,
    sub,
    tone = 'neutral',
    onClick,
    className = '',
    ...props
}) {
    const detailText = detail || sub
    const isClickable = typeof onClick === 'function'

    return (
        <article
            className={`metric-card ${tone} ${isClickable ? 'clickable' : ''} ${className}`.trim()}
            onClick={onClick}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={
                isClickable
                    ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              onClick(e)
                          }
                      }
                    : undefined
            }
            {...props}
        >
            <div className="metric-top">
                <span>{label}</span>
                <span className="metric-status" />
            </div>

            <strong>{value}</strong>

            {detailText && <p>{detailText}</p>}
        </article>
    )
}

export default MetricCard