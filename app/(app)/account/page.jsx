import { requireUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function AccountPage({ searchParams }) {
    const user = await requireUser();
    const { discord } = await searchParams;
    const discordReady = Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
    return (<>
      <h1 className="page-title">Mon compte</h1>
      <p className="page-sub">Le compte se crée avec l'email. Le Discord doit être relié avant l'attribution d'une clé.</p>
      <div className="grid">
        <article className="card">
          <h2>Identité</h2>
          <div className="stat"><div>Email</div><b style={{ fontSize: 16 }}>{user.email}</b></div>
          <div className="stat"><div>Rôle</div><b style={{ fontSize: 16 }}>{user.role === "manager" ? "Manager" : "Client"}</b></div>
          <div className="stat">
            <div>Discord</div>
            <b className={user.discordId ? "ok" : "warn"} style={{ fontSize: 16 }}>{user.discordName || "Non relié"}</b>
          </div>
          {discord === "ok" && <div className="success">Discord relié au compte.</div>}
          {discord === "pris" && <div className="notice">Ce Discord est déjà utilisé par un autre compte.</div>}
          {discord === "erreur" && <div className="notice">La liaison Discord a échoué. Réessaie.</div>}
        </article>
        <article className="card">
          <h2>Lier Discord</h2>
          <p className="hint">Une fois relié, le manager peut t'attribuer une clé 7j, 30j, 3m, 1 an ou LifeTime.</p>
          {user.discordId ? (<div className="success">Compte Discord confirmé.</div>) : discordReady ? (<a className="btn primary" href="/api/discord/start">Relier Discord</a>) : (<div className="notice">
              Le bouton Discord s'active quand DISCORD_CLIENT_ID et DISCORD_CLIENT_SECRET sont dans les variables Vercel.
              Redirect : {process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/discord/callback
            </div>)}
        </article>
      </div>
    </>);
}
