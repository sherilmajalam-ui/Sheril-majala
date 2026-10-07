export default function EmptyState({ emoji, className = "empty", style, children }) {
    return (
        <div className={className} style={style}>
            <span className="emoji">{emoji}</span>
            {children}
        </div>
    );
}
