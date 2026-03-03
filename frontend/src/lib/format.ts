const formatter = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export function formatCurrency(value: string | number) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return String(value || "EUR 0");
  return formatter.format(num);
}

export function parseMoney(value: string) {
  if (!value) return 0;
  let s = value.trim();
  if (!s) return 0;
  s = s.replace(/[€\s]/g, "");
  if (s.includes(".") && s.includes(",")) {
    // it-IT style, e.g. 1.234,56
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export function formatPraticaRef(id: number, nrPratica?: string | null) {
  return nrPratica ? `Pratica ${nrPratica}` : `Pratica #${id}`;
}

export function formatPraticaOptionLabel(p: {
  id: number;
  nr_pratica?: string | null;
  nr_ctr?: string | null;
  leasing?: string | null;
  broker?: string | null;
}) {
  const base = formatPraticaRef(p.id, p.nr_pratica);
  const parts = [base];
  if (p.nr_ctr) parts.push(`Contratto ${p.nr_ctr}`);
  let label = parts.join(" Â· ");
  if (p.leasing) label += ` - ${p.leasing}`;
  if (p.broker) label += ` (${p.broker})`;
  return label;
}
