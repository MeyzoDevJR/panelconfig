import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
export default function RegisterPage() {
    return (<main className="auth-wrap">
      <section className="card auth-card">
        <div className="brand">
          <div className="mark">O</div>
          <div>
            <strong>Ozona</strong>
            <span>Panel de configuration</span>
          </div>
        </div>
        <h1>Créer un compte</h1>
        <p className="page-sub">Email et mot de passe. Le Discord se relie juste après.</p>
        <AuthForm mode="register"/>
        <p className="switch">Déjà un compte ? <Link href="/login">Connexion</Link></p>
      </section>
    </main>);
}
