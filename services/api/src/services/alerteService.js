// Pure, side-effect-free detection of regulatory expiry alerts for a lot
// (DAT Sprint 3). No database access here so the rules stay unit-testable.

// Months before expiry at which an "orange" (upcoming) alert is raised,
// per diagnostic type. Anything past the expiry date is "rouge".
const ORANGE_THRESHOLD_MONTHS = {
  dpe: 6,
  erp: 1,
  amiante: 1,
  plomb: 1,
  electricite: 1,
  gaz: 1,
  carrez: 1,
  termites: 1,
  assainissement: 1,
  bruit: 1,
  default: 1
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function thresholdMonths(type) {
  return ORANGE_THRESHOLD_MONTHS[type] ?? ORANGE_THRESHOLD_MONTHS.default;
}

// Returns 'rouge' | 'orange' | null for a given expiry date and type.
export function evaluateExpiration(dateExpiration, type, now = new Date()) {
  if (!dateExpiration) {
    return null;
  }
  const expiry = new Date(dateExpiration);
  if (Number.isNaN(expiry.getTime())) {
    return null;
  }
  if (expiry.getTime() <= now.getTime()) {
    return 'rouge';
  }
  const orangeFrom = addMonths(expiry, -thresholdMonths(type));
  if (now.getTime() >= orangeFrom.getTime()) {
    return 'orange';
  }
  return null;
}

function daysUntil(date, now) {
  return Math.round((new Date(date).getTime() - now.getTime()) / MS_PER_DAY);
}

// Builds the list of alerts for a single lot (the "lot" being a Property
// document extended with dpe / diagnostics). Each alert is a plain object
// ready to be persisted into the `alertes` collection.
export function checkDiagnosticExpiration(lot, now = new Date()) {
  const alertes = [];
  if (!lot) {
    return alertes;
  }

  const base = {
    lotId: lot._id ? String(lot._id) : undefined,
    immeubleId: lot.immeubleId ? String(lot.immeubleId) : undefined
  };

  // DPE: expiry is explicit or derived from realisation date + 10 years.
  const dpe = lot.dpe;
  if (dpe) {
    const dpeExpiration =
      dpe.dateExpiration ||
      (dpe.dateRealisation ? addYears(dpe.dateRealisation, 10) : undefined);
    const niveau = evaluateExpiration(dpeExpiration, 'dpe', now);
    if (niveau) {
      alertes.push({
        ...base,
        type: 'dpe',
        niveau,
        dateExpiration: dpeExpiration,
        message:
          niveau === 'rouge'
            ? 'DPE expiré'
            : `DPE expire dans ${daysUntil(dpeExpiration, now)} jours`
      });
    }
    // Loi Climat: F/G rated dwellings are progressively banned from renting.
    if (dpe.note === 'F' || dpe.note === 'G' || dpe.loiClimatAlerte) {
      alertes.push({
        ...base,
        type: 'dpe_loi_climat',
        niveau: 'orange',
        dateExpiration: dpeExpiration,
        message: `Logement classé ${dpe.note || 'F/G'} — alerte Loi Climat (passoire énergétique)`
      });
    }
  }

  // Regulatory diagnostics.
  for (const diag of lot.diagnostics || []) {
    const niveau = evaluateExpiration(diag.dateExpiration, diag.type, now);
    if (niveau) {
      alertes.push({
        ...base,
        type: diag.type || 'diagnostic',
        niveau,
        dateExpiration: diag.dateExpiration,
        message:
          niveau === 'rouge'
            ? `Diagnostic ${diag.type || ''} expiré`.trim()
            : `Diagnostic ${diag.type || ''} expire dans ${daysUntil(diag.dateExpiration, now)} jours`.trim()
      });
    }
  }

  return alertes;
}

export { addYears, addMonths };
