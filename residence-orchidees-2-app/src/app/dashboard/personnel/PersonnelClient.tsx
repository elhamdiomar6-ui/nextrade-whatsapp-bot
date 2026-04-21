"use client";

import { useState, useTransition } from "react";
import { useLang } from "@/contexts/LangContext";
import { useToast } from "@/components/Toast";
import {
  createStaff,
  updateStaff,
  createStaffTask,
  createStaffPlanning,
  markPlanningDone,
  createStaffPayment,
  deleteStaffTask,
} from "@/actions/staff";

// ─── Types ────────────────────────────────────────────────────────────────────

type StaffTask = {
  id: string;
  date: string;
  areas: string[];
  duration: number | null;
  status: string;
  notes: string | null;
};

type StaffPlanning = {
  id: string;
  date: string;
  areas: string[];
  notes: string | null;
  done: boolean;
};

type StaffPayment = {
  id: string;
  amount: number;
  date: string;
  period: string | null;
  salaryType: string;
  notes: string | null;
};

type StaffMember = {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  cin: string | null;
  startDate: string | null;
  salary: number | null;
  salaryType: string;
  notes: string | null;
  active: boolean;
  tasks: StaffTask[];
  plannings: StaffPlanning[];
  payments: StaffPayment[];
};

interface Props {
  staff: StaffMember[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_AREAS = [
  "ESCALIERS", "SS1", "SS2", "TERRASSE", "PARTIES_COMMUNES",
  "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10",
  "MAG1", "MAG2", "MAG3", "MAG4", "CONCIERGE",
];

function roleLabel(role: string, isAr: boolean) {
  if (role === "CLEANING") return isAr ? "عاملة النظافة" : "Femme de ménage";
  if (role === "GUARDIAN") return isAr ? "الحارس" : "Gardien";
  return isAr ? "آخر" : "Autre";
}

function roleBg(role: string) {
  if (role === "CLEANING") return { background: "#dbeafe", color: "#1d4ed8" };
  if (role === "GUARDIAN") return { background: "#dcfce7", color: "#15803d" };
  return { background: "#f3f4f6", color: "#374151" };
}

function salaryLabel(type: string, isAr: boolean) {
  if (type === "MONTHLY") return isAr ? "شهري" : "Mensuel";
  if (type === "DAILY") return isAr ? "يومي" : "À la journée";
  return isAr ? "بالمهمة" : "À la tâche";
}

function statusLabel(status: string, isAr: boolean) {
  if (status === "DONE") return isAr ? "منجز" : "Effectué";
  if (status === "PLANNED") return isAr ? "مخطط" : "Planifié";
  return isAr ? "ملغى" : "Annulé";
}

function statusColor(status: string) {
  if (status === "DONE") return { background: "#dcfce7", color: "#15803d" };
  if (status === "PLANNED") return { background: "#dbeafe", color: "#1d4ed8" };
  return { background: "#fee2e2", color: "#b91c1c" };
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db",
  borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none",
  color: "#111827", background: "#fff",
};

const selectStyle: React.CSSProperties = { ...inputStyle };

function AreaCheckboxes({ selected, onChange }: { selected: string[]; onChange: (a: string[]) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
      {ALL_AREAS.map((a) => (
        <label key={a} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, cursor: "pointer", padding: "4px 6px", borderRadius: 6, background: selected.includes(a) ? "#dcfce7" : "#f9fafb", border: `1px solid ${selected.includes(a) ? "#86efac" : "#e5e7eb"}` }}>
          <input
            type="checkbox"
            checked={selected.includes(a)}
            onChange={(e) => {
              if (e.target.checked) onChange([...selected, a]);
              else onChange(selected.filter((x) => x !== a));
            }}
            style={{ margin: 0 }}
          />
          <span>{a}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Add Staff Modal ──────────────────────────────────────────────────────────

function AddStaffModal({ onClose, isAr }: { onClose: () => void; isAr: boolean }) {
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", role: "CLEANING", phone: "", email: "", address: "", cin: "", startDate: "", salary: "", salaryType: "MONTHLY", notes: "" });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createStaff({
          name: form.name,
          role: form.role,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          cin: form.cin || undefined,
          startDate: form.startDate || undefined,
          salary: form.salary ? parseFloat(form.salary) : undefined,
          salaryType: form.salaryType,
          notes: form.notes || undefined,
        });
        showToast(isAr ? "تمت إضافة الموظف" : "Membre du personnel ajouté", "success");
        onClose();
      } catch {
        showToast(isAr ? "حدث خطأ" : "Erreur lors de l'ajout", "error");
      }
    });
  }

  return (
    <Modal title={isAr ? "إضافة موظف جديد" : "Nouveau membre du personnel"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label={isAr ? "الاسم الكامل *" : "Nom complet *"}>
          <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>
        <Field label={isAr ? "الوظيفة" : "Rôle"}>
          <select style={selectStyle} value={form.role} onChange={(e) => set("role", e.target.value)}>
            <option value="CLEANING">{isAr ? "عاملة النظافة" : "Femme de ménage"}</option>
            <option value="GUARDIAN">{isAr ? "الحارس" : "Gardien"}</option>
            <option value="OTHER">{isAr ? "آخر" : "Autre"}</option>
          </select>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={isAr ? "الهاتف" : "Téléphone"}>
            <input style={inputStyle} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="CIN">
            <input style={inputStyle} value={form.cin} onChange={(e) => set("cin", e.target.value)} />
          </Field>
        </div>
        <Field label={isAr ? "البريد الإلكتروني" : "Email"}>
          <input style={inputStyle} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label={isAr ? "العنوان" : "Adresse"}>
          <input style={inputStyle} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={isAr ? "تاريخ البداية" : "Date de début"}>
            <input style={inputStyle} type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
          <Field label={isAr ? "نوع الأجر" : "Type de salaire"}>
            <select style={selectStyle} value={form.salaryType} onChange={(e) => set("salaryType", e.target.value)}>
              <option value="MONTHLY">{isAr ? "شهري" : "Mensuel"}</option>
              <option value="DAILY">{isAr ? "يومي" : "À la journée"}</option>
              <option value="TASK">{isAr ? "بالمهمة" : "À la tâche"}</option>
            </select>
          </Field>
        </div>
        <Field label={isAr ? "الأجر (درهم)" : "Salaire (MAD)"}>
          <input style={inputStyle} type="number" min="0" value={form.salary} onChange={(e) => set("salary", e.target.value)} />
        </Field>
        <Field label={isAr ? "ملاحظات" : "Notes"}>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 14 }}>
            {isAr ? "إلغاء" : "Annuler"}
          </button>
          <button type="submit" disabled={pending} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#166534", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, opacity: pending ? 0.7 : 1 }}>
            {pending ? (isAr ? "جاري..." : "En cours...") : (isAr ? "إضافة" : "Ajouter")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Edit Staff Modal ─────────────────────────────────────────────────────────

function EditStaffModal({ member, onClose, isAr }: { member: StaffMember; onClose: () => void; isAr: boolean }) {
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: member.name,
    phone: member.phone ?? "",
    email: member.email ?? "",
    address: member.address ?? "",
    cin: member.cin ?? "",
    salary: member.salary?.toString() ?? "",
    salaryType: member.salaryType,
    notes: member.notes ?? "",
    active: member.active,
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateStaff(member.id, {
          name: form.name,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          cin: form.cin || undefined,
          salary: form.salary ? parseFloat(form.salary) : undefined,
          salaryType: form.salaryType,
          notes: form.notes || undefined,
          active: form.active,
        });
        showToast(isAr ? "تم تحديث البيانات" : "Données mises à jour", "success");
        onClose();
      } catch {
        showToast(isAr ? "حدث خطأ" : "Erreur lors de la mise à jour", "error");
      }
    });
  }

  return (
    <Modal title={isAr ? "تعديل بيانات الموظف" : "Modifier le membre"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label={isAr ? "الاسم الكامل *" : "Nom complet *"}>
          <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={isAr ? "الهاتف" : "Téléphone"}>
            <input style={inputStyle} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="CIN">
            <input style={inputStyle} value={form.cin} onChange={(e) => set("cin", e.target.value)} />
          </Field>
        </div>
        <Field label={isAr ? "البريد الإلكتروني" : "Email"}>
          <input style={inputStyle} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label={isAr ? "العنوان" : "Adresse"}>
          <input style={inputStyle} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={isAr ? "نوع الأجر" : "Type de salaire"}>
            <select style={selectStyle} value={form.salaryType} onChange={(e) => set("salaryType", e.target.value)}>
              <option value="MONTHLY">{isAr ? "شهري" : "Mensuel"}</option>
              <option value="DAILY">{isAr ? "يومي" : "À la journée"}</option>
              <option value="TASK">{isAr ? "بالمهمة" : "À la tâche"}</option>
            </select>
          </Field>
          <Field label={isAr ? "الأجر (درهم)" : "Salaire (MAD)"}>
            <input style={inputStyle} type="number" min="0" value={form.salary} onChange={(e) => set("salary", e.target.value)} />
          </Field>
        </div>
        <Field label={isAr ? "ملاحظات" : "Notes"}>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
        <Field label={isAr ? "الحالة" : "Statut"}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
            {isAr ? "نشط" : "Actif"}
          </label>
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 14 }}>
            {isAr ? "إلغاء" : "Annuler"}
          </button>
          <button type="submit" disabled={pending} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#166534", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, opacity: pending ? 0.7 : 1 }}>
            {pending ? (isAr ? "جاري..." : "En cours...") : (isAr ? "حفظ" : "Enregistrer")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────

function AddTaskModal({ staffId, onClose, isAr }: { staffId: string; onClose: () => void; isAr: boolean }) {
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), areas: [] as string[], duration: "", status: "DONE", notes: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.areas.length === 0) { showToast(isAr ? "اختر منطقة على الأقل" : "Sélectionnez au moins une zone", "error"); return; }
    startTransition(async () => {
      try {
        await createStaffTask({
          staffId,
          date: form.date,
          areas: form.areas,
          duration: form.duration ? parseFloat(form.duration) : undefined,
          status: form.status,
          notes: form.notes || undefined,
        });
        showToast(isAr ? "تمت إضافة التدخل" : "Intervention ajoutée", "success");
        onClose();
      } catch {
        showToast(isAr ? "حدث خطأ" : "Erreur", "error");
      }
    });
  }

  return (
    <Modal title={isAr ? "إضافة تدخل" : "Ajouter une intervention"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label={isAr ? "التاريخ" : "Date"}>
          <input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
        </Field>
        <Field label={isAr ? "المناطق" : "Zones"}>
          <AreaCheckboxes selected={form.areas} onChange={(a) => setForm((f) => ({ ...f, areas: a }))} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={isAr ? "المدة (ساعة)" : "Durée (h)"}>
            <input style={inputStyle} type="number" min="0" step="0.5" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
          </Field>
          <Field label={isAr ? "الحالة" : "Statut"}>
            <select style={selectStyle} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="DONE">{isAr ? "منجز" : "Effectué"}</option>
              <option value="PLANNED">{isAr ? "مخطط" : "Planifié"}</option>
              <option value="CANCELLED">{isAr ? "ملغى" : "Annulé"}</option>
            </select>
          </Field>
        </div>
        <Field label={isAr ? "ملاحظات" : "Notes"}>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 14 }}>
            {isAr ? "إلغاء" : "Annuler"}
          </button>
          <button type="submit" disabled={pending} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#166534", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, opacity: pending ? 0.7 : 1 }}>
            {pending ? "..." : (isAr ? "إضافة" : "Ajouter")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Add Planning Modal ───────────────────────────────────────────────────────

function AddPlanningModal({ staffId, onClose, isAr }: { staffId: string; onClose: () => void; isAr: boolean }) {
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ date: "", areas: [] as string[], notes: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) { showToast(isAr ? "اختر تاريخاً" : "Choisissez une date", "error"); return; }
    if (form.areas.length === 0) { showToast(isAr ? "اختر منطقة" : "Sélectionnez une zone", "error"); return; }
    startTransition(async () => {
      try {
        await createStaffPlanning({ staffId, date: form.date, areas: form.areas, notes: form.notes || undefined });
        showToast(isAr ? "تمت الجدولة" : "Planning ajouté", "success");
        onClose();
      } catch {
        showToast(isAr ? "حدث خطأ" : "Erreur", "error");
      }
    });
  }

  return (
    <Modal title={isAr ? "جدولة مهمة" : "Planifier une tâche"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label={isAr ? "التاريخ" : "Date"}>
          <input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
        </Field>
        <Field label={isAr ? "المناطق" : "Zones"}>
          <AreaCheckboxes selected={form.areas} onChange={(a) => setForm((f) => ({ ...f, areas: a }))} />
        </Field>
        <Field label={isAr ? "ملاحظات" : "Notes"}>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 14 }}>
            {isAr ? "إلغاء" : "Annuler"}
          </button>
          <button type="submit" disabled={pending} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#166534", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, opacity: pending ? 0.7 : 1 }}>
            {pending ? "..." : (isAr ? "جدولة" : "Planifier")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Add Payment Modal ────────────────────────────────────────────────────────

function AddPaymentModal({ staffId, onClose, isAr }: { staffId: string; onClose: () => void; isAr: boolean }) {
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ amount: "", date: new Date().toISOString().slice(0, 10), period: "", salaryType: "MONTHLY", notes: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount) { showToast(isAr ? "أدخل المبلغ" : "Entrez le montant", "error"); return; }
    startTransition(async () => {
      try {
        await createStaffPayment({
          staffId,
          amount: parseFloat(form.amount),
          date: form.date,
          period: form.period || undefined,
          salaryType: form.salaryType,
          notes: form.notes || undefined,
        });
        showToast(isAr ? "تم تسجيل الدفع" : "Paiement enregistré", "success");
        onClose();
      } catch {
        showToast(isAr ? "حدث خطأ" : "Erreur", "error");
      }
    });
  }

  return (
    <Modal title={isAr ? "تسجيل دفع" : "Enregistrer un paiement"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label={isAr ? "المبلغ (درهم) *" : "Montant (MAD) *"}>
          <input style={inputStyle} type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={isAr ? "التاريخ" : "Date"}>
            <input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          </Field>
          <Field label={isAr ? "نوع الأجر" : "Type"}>
            <select style={selectStyle} value={form.salaryType} onChange={(e) => setForm((f) => ({ ...f, salaryType: e.target.value }))}>
              <option value="MONTHLY">{isAr ? "شهري" : "Mensuel"}</option>
              <option value="DAILY">{isAr ? "يومي" : "À la journée"}</option>
              <option value="TASK">{isAr ? "بالمهمة" : "À la tâche"}</option>
            </select>
          </Field>
        </div>
        <Field label={isAr ? "الفترة (مثال: مارس 2026)" : "Période (ex: Mars 2026)"}>
          <input style={inputStyle} value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} />
        </Field>
        <Field label={isAr ? "ملاحظات" : "Notes"}>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 14 }}>
            {isAr ? "إلغاء" : "Annuler"}
          </button>
          <button type="submit" disabled={pending} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#166534", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, opacity: pending ? 0.7 : 1 }}>
            {pending ? "..." : (isAr ? "تسجيل" : "Enregistrer")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Staff Card ───────────────────────────────────────────────────────────────

function StaffCard({ member, isAr }: { member: StaffMember; isAr: boolean }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"tasks" | "planning" | "payments">("tasks");
  const [modal, setModal] = useState<null | "edit" | "task" | "planning" | "payment">(null);
  const [pending, startTransition] = useTransition();

  const currentYear = new Date().getFullYear();
  const totalPaidYear = member.payments
    .filter((p) => new Date(p.date).getFullYear() === currentYear)
    .reduce((sum, p) => sum + p.amount, 0);

  function handleDeleteTask(id: string) {
    if (!confirm(isAr ? "حذف هذا التدخل؟" : "Supprimer cette intervention ?")) return;
    startTransition(async () => {
      try {
        await deleteStaffTask(id);
        showToast(isAr ? "تم الحذف" : "Supprimé", "success");
      } catch {
        showToast(isAr ? "حدث خطأ" : "Erreur", "error");
      }
    });
  }

  function handleTogglePlanning(id: string, done: boolean) {
    startTransition(async () => {
      try {
        await markPlanningDone(id, !done);
      } catch {
        showToast(isAr ? "حدث خطأ" : "Erreur", "error");
      }
    });
  }

  const tabs = [
    { key: "tasks" as const, label: isAr ? "سجل العمل" : "Suivi travail" },
    { key: "planning" as const, label: isAr ? "التخطيط" : "Planning" },
    { key: "payments" as const, label: isAr ? "المرتب" : "Rémunération" },
  ];

  return (
    <>
      {modal === "edit" && <EditStaffModal member={member} onClose={() => setModal(null)} isAr={isAr} />}
      {modal === "task" && <AddTaskModal staffId={member.id} onClose={() => setModal(null)} isAr={isAr} />}
      {modal === "planning" && <AddPlanningModal staffId={member.id} onClose={() => setModal(null)} isAr={isAr} />}
      {modal === "payment" && <AddPaymentModal staffId={member.id} onClose={() => setModal(null)} isAr={isAr} />}

      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {/* Card header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Avatar */}
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: member.role === "CLEANING" ? "#dbeafe" : "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
              {member.role === "CLEANING" ? "🧹" : member.role === "GUARDIAN" ? "🔑" : "👤"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{member.name}</span>
                <span style={{ ...roleBg(member.role), fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20 }}>
                  {roleLabel(member.role, isAr)}
                </span>
                {!member.active && (
                  <span style={{ background: "#fee2e2", color: "#b91c1c", fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20 }}>
                    {isAr ? "غير نشط" : "Inactif"}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
                {member.phone && (
                  <span style={{ fontSize: 13, color: "#6b7280" }}>📞 {member.phone}</span>
                )}
                {member.salary && (
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    💰 {member.salary.toLocaleString()} MAD / {salaryLabel(member.salaryType, isAr)}
                  </span>
                )}
                {member.cin && (
                  <span style={{ fontSize: 13, color: "#6b7280" }}>CIN: {member.cin}</span>
                )}
              </div>
              {member.startDate && (
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                  {isAr ? "منذ" : "Depuis"} {fmt(member.startDate)}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setModal("edit")}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}
          >
            {isAr ? "تعديل" : "Modifier"}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: "10px 8px", fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? "#166534" : "#6b7280",
                background: "none", border: "none", borderBottom: activeTab === tab.key ? "2px solid #166534" : "2px solid transparent",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: "16px 20px 20px" }}>
          {/* TASKS TAB */}
          {activeTab === "tasks" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
                  {member.tasks.length} {isAr ? "تدخل" : "intervention(s)"}
                </span>
                <button
                  onClick={() => setModal("task")}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#166534", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  + {isAr ? "إضافة تدخل" : "Ajouter une intervention"}
                </button>
              </div>
              {member.tasks.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>
                  {isAr ? "لا توجد تدخلات مسجلة" : "Aucune intervention enregistrée"}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {member.tasks.map((task) => (
                    <div key={task.id} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{fmt(task.date)}</span>
                          <span style={{ ...statusColor(task.status), fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12 }}>
                            {statusLabel(task.status, isAr)}
                          </span>
                          {task.duration && (
                            <span style={{ fontSize: 12, color: "#6b7280" }}>⏱ {task.duration}h</span>
                          )}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {task.areas.map((a) => (
                            <span key={a} style={{ fontSize: 11, background: "#e5e7eb", color: "#374151", padding: "2px 7px", borderRadius: 8 }}>{a}</span>
                          ))}
                        </div>
                        {task.notes && <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4, margin: "4px 0 0" }}>{task.notes}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={pending}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16, flexShrink: 0, padding: "2px 4px" }}
                        title={isAr ? "حذف" : "Supprimer"}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PLANNING TAB */}
          {activeTab === "planning" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
                  {isAr ? "المهام القادمة (7 أيام)" : "Tâches prévues (7 jours)"}
                </span>
                <button
                  onClick={() => setModal("planning")}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#1d4ed8", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  + {isAr ? "جدولة" : "Planifier"}
                </button>
              </div>
              {member.plannings.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>
                  {isAr ? "لا يوجد تخطيط" : "Aucune tâche planifiée"}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {member.plannings.map((plan) => (
                    <div key={plan.id} style={{ background: plan.done ? "#f0fdf4" : "#eff6ff", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, border: `1px solid ${plan.done ? "#bbf7d0" : "#bfdbfe"}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{fmt(plan.date)}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12, background: plan.done ? "#dcfce7" : "#dbeafe", color: plan.done ? "#15803d" : "#1d4ed8" }}>
                            {plan.done ? (isAr ? "مكتمل" : "Fait") : (isAr ? "في الانتظار" : "En attente")}
                          </span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {plan.areas.map((a) => (
                            <span key={a} style={{ fontSize: 11, background: "#e5e7eb", color: "#374151", padding: "2px 7px", borderRadius: 8 }}>{a}</span>
                          ))}
                        </div>
                        {plan.notes && <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>{plan.notes}</p>}
                      </div>
                      <button
                        onClick={() => handleTogglePlanning(plan.id, plan.done)}
                        disabled={pending}
                        style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #d1d5db", background: plan.done ? "#f3f4f6" : "#166534", color: plan.done ? "#374151" : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, flexShrink: 0 }}
                      >
                        {plan.done ? (isAr ? "إلغاء" : "Annuler") : "✓"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === "payments" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    {isAr ? "إجمالي" : "Total"} {currentYear}:{" "}
                    <strong style={{ color: "#166534" }}>{totalPaidYear.toLocaleString()} MAD</strong>
                  </span>
                </div>
                <button
                  onClick={() => setModal("payment")}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  + {isAr ? "تسجيل دفع" : "Enregistrer paiement"}
                </button>
              </div>
              {member.payments.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>
                  {isAr ? "لا توجد مدفوعات" : "Aucun paiement enregistré"}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {member.payments.map((pay) => (
                    <div key={pay.id} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>
                          {pay.amount.toLocaleString()} MAD
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          {fmt(pay.date)}{pay.period ? ` · ${pay.period}` : ""}
                        </div>
                        {pay.notes && <div style={{ fontSize: 12, color: "#9ca3af" }}>{pay.notes}</div>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12, background: "#ede9fe", color: "#7c3aed" }}>
                        {salaryLabel(pay.salaryType, isAr)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main PersonnelClient ─────────────────────────────────────────────────────

export function PersonnelClient({ staff }: Props) {
  const { isRtl } = useLang();
  const isAr = isRtl;
  const [showAddModal, setShowAddModal] = useState(false);

  const activeCount = staff.filter((s) => s.active).length;

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }} dir={isAr ? "rtl" : "ltr"}>
      {showAddModal && <AddStaffModal onClose={() => setShowAddModal(false)} isAr={isAr} />}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>
            {isAr ? "إدارة الموظفين" : "Gestion du personnel"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
            {activeCount} {isAr ? "موظف نشط" : "membre(s) actif(s)"}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "none", background: "#166534", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, boxShadow: "0 2px 8px rgba(22,101,52,0.2)" }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          {isAr ? "موظف جديد" : "Nouveau membre"}
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: isAr ? "إجمالي الموظفين" : "Total membres", value: staff.length, color: "#166534", bg: "#f0fdf4" },
          { label: isAr ? "موظفون نشطون" : "Actifs", value: activeCount, color: "#1d4ed8", bg: "#eff6ff" },
          { label: isAr ? "إجمالي التدخلات" : "Interventions", value: staff.reduce((s, m) => s + m.tasks.length, 0), color: "#d97706", bg: "#fffbeb" },
          { label: isAr ? "مدفوعات " + new Date().getFullYear() : "Payé " + new Date().getFullYear(), value: staff.reduce((s, m) => s + m.payments.filter((p) => new Date(p.date).getFullYear() === new Date().getFullYear()).reduce((a, p) => a + p.amount, 0), 0).toLocaleString() + " MAD", color: "#7c3aed", bg: "#f5f3ff" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 12, padding: "14px 16px", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Staff cards */}
      {staff.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1px dashed #d1d5db" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👷</div>
          <p style={{ fontSize: 15, color: "#6b7280", margin: 0 }}>
            {isAr ? "لا يوجد موظفون حتى الآن" : "Aucun membre du personnel enregistré"}
          </p>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>
            {isAr ? "أضف موظفاً جديداً للبدء" : "Ajoutez un premier membre pour commencer"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {staff.map((member) => (
            <StaffCard key={member.id} member={member} isAr={isAr} />
          ))}
        </div>
      )}
    </div>
  );
}
