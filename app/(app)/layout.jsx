import { requireUser } from "@/lib/auth";
import { Shell } from "@/components/Shell";
export default async function AppLayout({ children }) {
    const user = await requireUser();
    return (<Shell user={{ email: user.email, role: user.role, discordName: user.discordName }}>
      {children}
    </Shell>);
}
