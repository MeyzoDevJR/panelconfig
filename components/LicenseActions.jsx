"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function CopyButton({ value }) {
    const [done, setDone] = useState(false);
    return (<button className="btn-line" type="button" onClick={async () => {
            await navigator.clipboard.writeText(value);
            setDone(true);
            setTimeout(() => setDone(false), 1200);
        }}>
      {done ? "Copié" : "Copier"}
    </button>);
}
export function ResetIpButton({ id }) {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    return (<button className="btn" type="button" disabled={pending} onClick={async () => {
            setPending(true);
            await fetch("/api/licenses/reset-ip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            setPending(false);
            router.refresh();
        }}>
      Réinitialiser l'IP
    </button>);
}
export function RedeemForm({ locked }) {
    const router = useRouter();
    const [key, setKey] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    async function onSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");
        const response = await fetch("/api/licenses/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key })
        });
        const data = await response.json();
        if (!response.ok) {
            setError(data.message || "Clé refusée.");
            return;
        }
        setKey("");
        setMessage("Clé activée. Place-la dans le server.cfg du serveur.");
        router.refresh();
    }
    if (locked) {
        return <div className="notice">Relie d'abord ton Discord dans Mon compte. Une clé ne peut pas être activée avant.</div>;
    }
    return (<form className="form" onSubmit={onSubmit}>
      <label className="field grow">
        <span>Activer une clé</span>
        <input value={key} onChange={(event) => setKey(event.target.value)} placeholder="OZONA_..." required/>
      </label>
      <button className="btn primary" type="submit">Activer</button>
      <div className="error" style={{ flexBasis: "100%" }}>{error}</div>
      {message && <div className="success" style={{ flexBasis: "100%" }}>{message}</div>}
    </form>);
}
