import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { getStore } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function ManagerPage() {
    const user = await requireManager();
    const store = await getStore();
    const licenses = await store.listLicenses();
    const users = await store.listUsers();
    const active = licenses.filter((license) => license.status === "active");
    const online = active.filter((license) => license.lastSeen && Date.now() - new Date(license.lastSeen).getTime() < 180000);
    return (<>
      <h1 className="page-title">Manager</h1>
      <p className="page-sub">Connecté en {user.email}. Toutes les clés et tous les comptes sont ici.</p>
      <div className="grid">
        <article className="card">
          <div className="card-head">
            <div>
              <h2>Serveurs liés</h2>
              <p className="hint">Chaque base, locale ou hébergée, appelle ce panel.</p>
            </div>
            <Link className="link" href="/manager/keys">Gérer les clés</Link>
          </div>
          {active.length === 0 ? <div className="empty">Aucune licence active.</div> : active.map((license) => (<div className="server" key={license.id}>
              <div>
                <strong>{license.hostname || license.key}</strong>
                <span>{PLANS[license.plan].long} · {license.lockedIp || "IP libre"}</span>
              </div>
              <b className={online.some((item) => item.id === license.id) ? "ok" : "warn"}>
                {online.some((item) => item.id === license.id) ? "En ligne" : "Hors ligne"}
              </b>
            </div>))}
        </article>
        <article className="card">
          <div className="stat"><div>Comptes</div><b>{users.length}</b></div>
          <div className="stat"><div>Licences actives</div><b>{active.length}</b></div>
          <div className="stat"><div>LifeTime</div><b>250 €</b></div>
          <p className="hint">Les durées disponibles sont 7j, 30j, 3m, 1 an et LifeTime.</p>
        </article>
      </div>
    </>);
}
