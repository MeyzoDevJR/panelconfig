import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
export default function LoginPage() {
    return (<main className="auth-wrap">
      <section className="card auth-card">
        <div className="brand">
          <div className="mark">O</div>
          <div>
            <strong>Ozona</strong>
            <span>Panel de configuration</span>
          </div>
        </div>
        <h1>Connexion</h1>
        <p className="page-sub">Entre sur ton espace pour relier Discord et ta licence.</p>
        <AuthForm mode="login"/>
        <p className="switch">Pas encore de compte ? <Link href="/register">Créer un compte</Link></p>
      </section>
    </main>);
}
