export default function StatusBadge({ status }) {
    return <span className={"badge badge-" + String(status).replace(/ /g, "-")}>{status}</span>;
}
