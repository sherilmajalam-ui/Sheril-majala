// Inline form message. msg is null or { text, type: "error" | "success" }
export default function Message({ msg, style }) {
    return (
        <p className={"message" + (msg ? " show " + (msg.type || "error") : "")} style={style}>
            {msg?.text}
        </p>
    );
}
