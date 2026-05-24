import { Collections } from '@immopatri/common';
import moment from 'moment';

// Builds the data injected into the "alerte" email (compliance digest sent to
// the landlord). recordId is the organization (realm) id.
export async function get(realmId, params) {
  const dbRealm = await Collections.Realm.findOne({ _id: realmId });
  if (!dbRealm) {
    throw new Error('organization not found');
  }
  const landlord = dbRealm.toObject();
  landlord.name =
    (landlord.isCompany
      ? landlord.companyInfo?.name
      : landlord.contacts?.[0]?.name) ||
    landlord.name ||
    '';

  const query = { realmId, acquittee: { $ne: true } };
  if (params?.niveau) {
    query.niveau = params.niveau;
  }
  const alertesDocs = await Collections.Alerte.find(query)
    .sort({ niveau: 1, dateExpiration: 1 })
    .lean();

  const alertes = alertesDocs.map((alerte) => ({
    type: alerte.type,
    niveau: alerte.niveau,
    message: alerte.message,
    dateExpiration: alerte.dateExpiration
      ? moment(alerte.dateExpiration).format('DD/MM/YYYY')
      : ''
  }));

  return {
    landlord,
    alertes,
    counts: {
      total: alertes.length,
      rouge: alertes.filter((alerte) => alerte.niveau === 'rouge').length,
      orange: alertes.filter((alerte) => alerte.niveau === 'orange').length
    },
    today: moment().format('DD/MM/YYYY')
  };
}
