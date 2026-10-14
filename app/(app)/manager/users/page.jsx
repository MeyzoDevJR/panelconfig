import { requireManager } from "@/lib/auth";
import { formatDate } from "@/lib/plans";
import { getStore } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function UsersPage() {
    await requireManager();
    const store = await getStore();
    const [users, licenses] = await Promise.all([store.listUsers(), store.listLicenses()]);
    return (<>
      <h1 className="page-title">Utilisateurs</h1>
      <p className="page-sub">Un compte sans Discord ne peut pas recevoir de clé.</p>
      <article className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Discord</th>
              <th>Rôle</th>
              <th>Licences</th>
              <th>Créé le</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (<tr key={user.id}>
                <td>{user.email}</td>
                <td className={user.discordId ? "ok" : "warn"}>{user.discordName || "Non relié"}</td>
                <td>{user.role === "manager" ? "Manager" : "Client"}</td>
                <td>{licenses.filter((license) => license.userId === user.id).length}</td>
                <td>{formatDate(user.createdAt)}</td>
              </tr>))}
          </tbody>
        </table>
      </article>
    </>);
}
