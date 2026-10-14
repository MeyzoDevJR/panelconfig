export const PLANS = {
    "7j": { id: "7j", label: "7j", long: "7 jours", days: 7, price: null },
    "30j": { id: "30j", label: "30j", long: "30 jours", days: 30, price: null },
    "3m": { id: "3m", label: "3m", long: "3 mois", days: 90, price: null },
    "1an": { id: "1an", label: "1 an", long: "1 an", days: 365, price: null },
    lifetime: { id: "lifetime", label: "LifeTime", long: "LifeTime", days: null, price: 250 }
};
export function isPlanId(value) {
    return Object.prototype.hasOwnProperty.call(PLANS, value);
}
export function expiryFrom(plan, from = new Date()) {
    const days = PLANS[plan].days;
    if (!days)
        return null;
    return new Date(from.getTime() + days * 86400000).toISOString();
}
export function remainingSeconds(expiresAt, lifetime) {
    if (lifetime)
        return null;
    if (!expiresAt)
        return 0;
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}
export function formatRemaining(seconds, lifetime) {
    if (lifetime)
        return "LifeTime";
    if (seconds === null || seconds <= 0)
        return "Expiré";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0)
        return `${days}j ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
    return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
}
export function formatDate(iso) {
    if (!iso)
        return "LifeTime";
    return new Intl.DateTimeFormat("fr-FR").format(new Date(iso));
}
