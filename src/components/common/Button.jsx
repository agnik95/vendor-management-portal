function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconAfter,
    isLoading = false,
    disabled = false,
    type = 'button',
    className = '',
    onClick,
    ...props
}) {
    const classes = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        className,
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <button
            type={type}
            className={classes}
            disabled={disabled || isLoading}
            onClick={onClick}
            {...props}
        >
            {isLoading ? (
                <span className="btn-spinner" aria-hidden="true" />
            ) : (
                icon && <span className="btn-icon">{icon}</span>
            )}
            <span>{children}</span>
            {!isLoading && iconAfter && (
                <span className="btn-icon-after">{iconAfter}</span>
            )}
        </button>
    )
}

export default Button
