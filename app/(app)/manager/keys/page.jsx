import { requireManager } from "@/lib/auth";
import { CreateKeyForm, RevokeButton } from "@/components/ManagerForms";
import { CopyButton } from "@/components/LicenseActions";
import { formatDate, formatRemaining, PLANS, remainingSeconds } from "@/lib/plans";
import { getStore } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function KeysPage() {
    await requireManager();
    const store = await getStore();
    const [licenses, users] = await Promise.all([store.listLicenses(), store.listUsers()]);
    const byId = new Map(users.map((user) => [user.id, user.email]));
    return (<>
      <h1 className="page-title">Clés</h1>
      <p className="page-sub">Attribue 7j, 30j, 3m, 1 an ou LifeTime. Le LifeTime est à 250 €.</p>
      <article className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div>
            <h2>Nouvelle clé</h2>
            <p className="hint">Si un email est indiqué, le Discord du compte doit déjà être relié. La durée démarre à l'attribution.</p>
          </div>
          <div>
            <div className="muted">LifeTime</div>
            <p className="price">250 € <small>/ à vie</small></p>
          </div>
        </div>
        <CreateKeyForm />
      </article>
      <article className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Clé</th>
              <th>Offre</th>
              <th>Compte</th>
              <th>Temps restant</th>
              <th>IP</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license) => {
            const seconds = remainingSeconds(license.expiresAt, license.plan === "lifetime");
            return (<tr key={license.id}>
                  <td className="key">{license.key}</td>
                  <td>{PLANS[license.plan].label}<div className="muted">{license.priceEur ? `${license.priceEur} €` : license.status}</div></td>
                  <td>{license.userId ? byId.get(license.userId) : "Non attribuée"}</td>
                  <td>{license.status === "active" ? formatRemaining(seconds, license.plan === "lifetime") : license.status}<div className="muted">{formatDate(license.expiresAt)}</div></td>
                  <td>{license.lockedIp || "—"}<div className="muted">{license.hostname || ""}</div></td>
                  <td className="actions">
                    <CopyButton value={license.key}/>
                    {license.status !== "revoked" && <RevokeButton id={license.id}/>}
                  </td>
                </tr>);
        })}
          </tbody>
        </table>
        {licenses.length === 0 && <div className="empty">Aucune clé générée.</div>}
      </article>
    </>);
}
