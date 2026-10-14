import { requireUser } from "@/lib/auth";
import { CopyButton, RedeemForm, ResetIpButton } from "@/components/LicenseActions";
import { formatDate, formatRemaining, PLANS, remainingSeconds } from "@/lib/plans";
import { getStore } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function LicensesPage({ searchParams }) {
    const user = await requireUser();
    const { q = "" } = await searchParams;
    const store = await getStore();
    const query = q.trim().toLowerCase();
    const licenses = (await store.listLicenses())
        .filter((license) => license.userId === user.id)
        .filter((license) => {
        if (!query)
            return true;
        return [license.key, license.hostname, license.plan, license.lockedIp].join(" ").toLowerCase().includes(query);
    });
    return (<>
      <h1 className="page-title">Mes licences</h1>
      <p className="page-sub">Tes clés, leur échéance et le serveur sur lequel elles sont verrouillées.</p>
      <article className="card" style={{ marginBottom: 16 }}>
        <RedeemForm locked={!user.discordId}/>
      </article>
      {licenses.length === 0 ? (<article className="card"><div className="empty">Aucune licence pour le moment.</div></article>) : licenses.map((license) => {
            const seconds = remainingSeconds(license.expiresAt, license.plan === "lifetime");
            return (<article className="license" key={license.id}>
            <div>
              <strong>{PLANS[license.plan].long}</strong>
              <span className="tag">{license.status === "active" ? "Active" : license.status}</span>
              <div className="key" style={{ marginTop: 8 }}>{license.key}</div>
              <div className="muted">Dans server.cfg : set ozona_license "{license.key}"</div>
            </div>
            <div>
              <div className="muted">Échéance</div>
              <strong>{license.plan === "lifetime" ? "LifeTime" : formatDate(license.expiresAt)}</strong>
              <div className="muted">{formatRemaining(seconds, license.plan === "lifetime")}</div>
            </div>
            <div>
              <div className="muted">IP verrouillée</div>
              <strong>{license.lockedIp || "En attente du serveur"}</strong>
              <div className="muted">{license.hostname || "Pas encore connecté"}</div>
            </div>
            <div className="actions">
              <CopyButton value={license.key}/>
              {license.status === "active" && <ResetIpButton id={license.id}/>}
            </div>
          </article>);
        })}
    </>);
}
