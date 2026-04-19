export async function register() {
  // Ne s'exécute qu'en runtime Node.js (pas edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCronJobs } = await import("@/lib/cron");
    startCronJobs();
  }
}
