"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function CreateKeyForm() {
    const router = useRouter();
    const [plan, setPlan] = useState("30j");
    const [email, setEmail] = useState("");
    const [note, setNote] = useState("");
    const [count, setCount] = useState(1);
    const [error, setError] = useState("");
    const [keys, setKeys] = useState([]);
    const [pending, setPending] = useState(false);
    async function onSubmit(event) {
        event.preventDefault();
        setPending(true);
        setError("");
        setKeys([]);
        const response = await fetch("/api/manager/keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan, email, note, count })
        });
        const data = await response.json();
        setPending(false);
        if (!response.ok) {
            setError(data.message || "Création impossible.");
            return;
        }
        setKeys(data.keys || []);
        setEmail("");
        setNote("");
        router.refresh();
    }
    return (<form className="stack" onSubmit={onSubmit}>
      <div className="form">
        <label className="field">
          <span>Durée</span>
          <select value={plan} onChange={(event) => setPlan(event.target.value)}>
            <option value="7j">7j</option>
            <option value="30j">30j</option>
            <option value="3m">3m</option>
            <option value="1an">1 an</option>
            <option value="lifetime">LifeTime — 250 €</option>
          </select>
        </label>
        <label className="field">
          <span>Nombre</span>
          <input type="number" min={1} max={20} value={count} onChange={(event) => setCount(Number(event.target.value))}/>
        </label>
        <label className="field grow">
          <span>Attribuer à (email, optionnel)</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="client@email.com"/>
        </label>
        <label className="field grow">
          <span>Note</span>
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Serveur du client"/>
        </label>
        <button className="btn primary" disabled={pending} type="submit">{pending ? "Création..." : "Générer"}</button>
      </div>
      <div className="error">{error}</div>
      {keys.length > 0 && (<div className="success">
          {keys.map((key) => <div key={key}>{key}</div>)}
        </div>)}
    </form>);
}
export function RevokeButton({ id }) {
    const router = useRouter();
    return (<button className="btn-line" type="button" onClick={async () => {
            await fetch("/api/manager/keys/revoke", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            router.refresh();
        }}>
      Révoquer
    </button>);
}
