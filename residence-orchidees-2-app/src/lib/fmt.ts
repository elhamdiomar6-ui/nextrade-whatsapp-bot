/** Format a number consistently (server + client) — avoids hydration mismatch */
export const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
