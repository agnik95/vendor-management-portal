function Card({
    title,
    subtitle,
    kicker,
    action,
    actions,
    children,
    className = '',
    hover = false,
    ...props
}) {
    const classes = [
        'card',
        hover ? 'card-hover' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ')

    const hasHeader = title || subtitle || kicker || action || actions

    return (
        <div className={classes} {...props}>
            {hasHeader && (
                <CardHeader
                    title={title}
                    subtitle={subtitle}
                    kicker={kicker}
                    action={action || actions}
                />
            )}
            {children}
        </div>
    )
}

function CardHeader({
    title,
    subtitle,
    kicker,
    action,
    actions,
    children,
    className = '',
}) {
    const act = action || actions

    return (
        <div className={`card-header ${className}`.trim()}>
            <div>
                {kicker && <span className="card-kicker">{kicker}</span>}
                {title && <h3 className="card-title">{title}</h3>}
                {subtitle && (
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-soft)', lineHeight: '1.4' }}>
                        {subtitle}
                    </p>
                )}
                {children}
            </div>
            {act && <div className="card-action">{act}</div>}
        </div>
    )
}

function CardBody({ children, className = '', flush, ...props }) {
    const classes = `card-body ${flush ? 'card-body-flush' : ''} ${className}`.trim()
    return (
        <div className={classes} {...props}>
            {children}
        </div>
    )
}

function CardFooter({ children, className = '', ...props }) {
    return (
        <div className={`card-footer ${className}`.trim()} {...props}>
            {children}
        </div>
    )
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
