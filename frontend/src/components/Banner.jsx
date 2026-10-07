export default function Banner({ title, children }) {
    return (
        <section className="page-banner">
            <h1>{title}</h1>
            {children && <p>{children}</p>}
        </section>
    );
}
