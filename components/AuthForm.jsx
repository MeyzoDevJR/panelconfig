"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function AuthForm({ mode }) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);
    async function onSubmit(event) {
        event.preventDefault();
        setPending(true);
        setError("");
        const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        setPending(false);
        if (!response.ok) {
            setError(data.message || "Action impossible.");
            return;
        }
        router.push("/dashboard");
        router.refresh();
    }
    return (<form className="stack" onSubmit={onSubmit}>
      <label className="field">
        <span>Email</span>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="toi@email.com"/>
      </label>
      <label className="field">
        <span>Mot de passe</span>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} placeholder="8 caractères minimum"/>
      </label>
      <div className="error">{error}</div>
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Patiente..." : mode === "login" ? "Connexion" : "Créer le compte"}
      </button>
    </form>);
}
