import { parseBankCsv, reconcile } from '../services/bankreconciliation.js';
import { Collections } from '@immopatri/common';

function buildTerm(year, month) {
  return Number(`${year}${String(month).padStart(2, '0')}0100`);
}

// Read-only: analyses a bank statement (CSV or pre-parsed transactions) and
// suggests matches against the tenants' rents for the given term. Records
// nothing — applying payments is left to the existing payment flow.
export async function analyse(req, res) {
  const realm = req.realm;
  const { csv, transactions: rawTransactions, year, month } = req.body;

  if (!year || !month) {
    return res.status(422).json({ errors: ['year and month are required'] });
  }

  const term = buildTerm(year, month);
  const transactions = Array.isArray(rawTransactions)
    ? rawTransactions
    : parseBankCsv(csv || '');

  const tenants = await Collections.Tenant.find({
    realmId: realm._id
  }).lean();

  const candidates = tenants
    .map((tenant) => {
      const rent = (tenant.rents || []).find(
        (item) => Number(item.term) === term
      );
      const grandTotal = rent?.total?.grandTotal ?? 0;
      const payment = rent?.total?.payment ?? 0;
      return {
        _id: String(tenant._id),
        name: tenant.isCompany ? tenant.company || tenant.name : tenant.name,
        expectedAmount: grandTotal,
        remaining: Math.round((grandTotal - payment) * 100) / 100
      };
    })
    .filter((candidate) => candidate.expectedAmount > 0);

  const { matches, unmatched } = reconcile(transactions, candidates, {
    tolerance: 0.01
  });

  return res.json({
    term,
    matchedCount: matches.length,
    unmatchedCount: unmatched.length,
    matches,
    unmatched
  });
}
