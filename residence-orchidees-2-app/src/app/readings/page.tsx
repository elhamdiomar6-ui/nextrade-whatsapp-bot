"use client";

import { useEffect, useState } from "react";

export default function ReadingsPage() {
  const [readings, setReadings] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [value, setValue] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");

  const load = async () => {
    const r = await fetch("/api/readings").then((res) => res.json());
    const u = await fetch("/api/units").then((res) => res.json());

    const allSubs = u.flatMap((u: any) =>
      u.subscriptions.map((s: any) => ({
        ...s,
        unitName: u.name,
      }))
    );

    setSubs(allSubs);
    setReadings(r);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!subscriptionId || !value) return;

    await fetch("/api/readings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value: Number(value),
        subscriptionId,
      }),
    });

    setValue("");
    load();
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Relevés compteurs</h1>

      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <select value={subscriptionId} onChange={(e) => setSubscriptionId(e.target.value)}>
          <option value="">Choisir compteur</option>
          {subs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.type} - {s.unitName || "Général"}
            </option>
          ))}
        </select>

        <input
          placeholder="Valeur"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <button onClick={submit}>Ajouter</button>
      </div>

      {readings.map((r) => (
        <div key={r.id} style={{ borderBottom: "1px solid #ccc", padding: "10px 0" }}>
          <p>
            <strong>{r.subscription.type}</strong> - {r.subscription.unit?.name || "Général"}
          </p>
          <p>Valeur actuelle: {r.value}</p>
          <p>Valeur précédente: {r.previousValue ?? "-"}</p>
          <p>Consommation: {r.consumption ?? "-"}</p>
          <p>
            Anomalie:{" "}
            <span style={{ color: r.anomaly ? "red" : "green" }}>
              {r.anomaly ? "Oui" : "Non"}
            </span>
          </p>
        </div>
      ))}
    </main>
  );
}
