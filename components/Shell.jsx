"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [
    { href: "/dashboard", label: "Tableau de bord", group: "Général" },
    { href: "/licenses", label: "Mes licences", group: "Gestion" },
    { href: "/account", label: "Mon compte", group: "Gestion" }
];
const crumbs = {
    "/dashboard": "Tableau de bord",
    "/licenses": "Mes licences",
    "/account": "Mon compte",
    "/manager": "Manager",
    "/manager/keys": "Clés",
    "/manager/users": "Utilisateurs"
};
export function Shell({ user, children }) {
    const pathname = usePathname();
    const crumb = crumbs[pathname] || "Ozona";
    const managerLinks = user.role === "manager"
        ? [
            { href: "/manager", label: "Vue manager" },
            { href: "/manager/keys", label: "Clés" },
            { href: "/manager/users", label: "Utilisateurs" }
        ]
        : [];
    return (<div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="mark">O</div>
          <div>
            <strong>Ozona</strong>
            <span>OzonaProject</span>
          </div>
        </div>
        <div className="nav-label">GÉNÉRAL</div>
        {links.filter((link) => link.group === "Général").map((link) => (<Link key={link.href} href={link.href} className={pathname === link.href ? "nav-item active" : "nav-item"}>{link.label}</Link>))}
        <div className="nav-label">GESTION</div>
        {links.filter((link) => link.group === "Gestion").map((link) => (<Link key={link.href} href={link.href} className={pathname === link.href ? "nav-item active" : "nav-item"}>{link.label}</Link>))}
        {managerLinks.length > 0 && (<>
            <div className="nav-label">MANAGER</div>
            {managerLinks.map((link) => (<Link key={link.href} href={link.href} className={pathname === link.href ? "nav-item active" : "nav-item"}>{link.label}</Link>))}
          </>)}
        <div className="sidebar-foot">
          <a className="nav-item" href="https://discord.gg/gtanew" target="_blank" rel="noreferrer">Aide et support</a>
          <form action="/api/auth/logout" method="post">
            <button className="ghost" type="submit">Déconnexion</button>
          </form>
          <div className="protected">PROTECTED</div>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div className="crumb">Général / <b>{crumb}</b></div>
          <form className="search" action="/licenses">
            <input name="q" placeholder="Chercher"/>
          </form>
          <div className="avatar" title={user.discordName || user.email}>{(user.discordName || user.email).slice(0, 1).toUpperCase()}</div>
        </header>
        <div className="content">{children}</div>
      </section>
    </div>);
}
