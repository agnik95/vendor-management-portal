function FormField({
    label,
    required = false,
    hint,
    error,
    id,
    children,
    className = '',
}) {
    return (
        <div className={`form-field ${className}`.trim()}>
            {label && (
                <label className="form-label" htmlFor={id}>
                    {label}
                    {required && <span className="form-label-required">*</span>}
                </label>
            )}
            {children}
            {error && <span className="form-error">{error}</span>}
            {!error && hint && <span className="form-hint">{hint}</span>}
        </div>
    )
}

export default FormField
