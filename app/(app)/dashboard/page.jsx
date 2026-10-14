import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatDate, formatRemaining, PLANS, remainingSeconds } from "@/lib/plans";
import { getStore } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
    const user = await requireUser();
    const store = await getStore();
    const licenses = (await store.listLicenses()).filter((license) => license.userId === user.id);
    const active = licenses.filter((license) => license.status === "active");
    const online = active.filter((license) => license.lastSeen && Date.now() - new Date(license.lastSeen).getTime() < 180000);
    const expired = licenses.filter((license) => license.status === "expired");
    return (<>
      <h1 className="page-title">Tableau de bord</h1>
      <p className="page-sub">Vue d'ensemble de vos serveurs</p>
      {!user.discordId && (<div className="notice">Ton Discord n'est pas relié. <Link href="/account">Relie-le</Link> avant qu'une clé puisse être attribuée.</div>)}
      <div className="grid">
        <article className="card">
          <div className="card-head">
            <div>
              <h2>Vos serveurs</h2>
              <p className="hint">Clique pour gérer</p>
            </div>
            <Link className="link" href="/licenses">Tout voir</Link>
          </div>
          {active.length === 0 ? (<div className="empty">Aucun serveur pour le moment.</div>) : active.map((license) => {
            const seconds = remainingSeconds(license.expiresAt, license.plan === "lifetime");
            const seen = license.lastSeen && Date.now() - new Date(license.lastSeen).getTime() < 180000;
            return (<div className="server" key={license.id}>
                <div>
                  <strong>{license.hostname || "Serveur en attente"}</strong>
                  <span>{PLANS[license.plan].long} · {formatRemaining(seconds, license.plan === "lifetime")} · IP {license.lockedIp || "non verrouillée"}</span>
                </div>
                <b className={seen ? "ok" : "warn"}>{seen ? "Opérationnel" : "Hors ligne"}</b>
              </div>);
        })}
        </article>
        <div className="stack">
          <article className="card">
            <div className="stat">
              <div>Serveurs<small>{online.length} en ligne</small></div>
              <b>{active.length}</b>
            </div>
            <div className="stat">
              <div>Licences<small>licences actives</small></div>
              <b>{active.length}</b>
            </div>
            <div className="stat">
              <div>Statut<small>{expired.length ? "une licence est échue" : "tous les serveurs actifs"}</small></div>
              <b className={expired.length ? "bad" : "ok"}>{expired.length ? "Expiré" : "Opérationnel"}</b>
            </div>
          </article>
          <article className="card">
            <div className="card-head">
              <div>
                <h2>À surveiller</h2>
                <p className="hint">Points nécessitant votre attention</p>
              </div>
            </div>
            {expired.length === 0 ? (<div className="check">
                <div className="dot">✓</div>
                <div>
                  <strong>Tout est opérationnel</strong>
                  <div className="muted">Aucune action requise.{licenses.some((item) => item.expiresAt) ? ` Prochaine échéance : ${formatDate(licenses.find((item) => item.expiresAt)?.expiresAt || null)}` : ""}</div>
                </div>
              </div>) : (<div className="notice">Une licence est expirée. Demande une nouvelle clé au manager.</div>)}
          </article>
        </div>
      </div>
    </>);
}
