import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { fetchPatrimoineDashboard, QueryKeys } from '../../utils/restcalls';
import { useQuery } from '@tanstack/react-query';

function Kpi({ label, value }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

// Patrimoine KPIs (DAT Sprint 7): counts, occupancy, monthly rent and
// compliance alerts.
export default function PatrimoineOverview() {
  const { data } = useQuery({
    queryKey: [QueryKeys.PATRIMOINE_DASHBOARD],
    queryFn: fetchPatrimoineDashboard
  });

  if (!data) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <Kpi label="Sites" value={data.nbSites} />
      <Kpi label="Immeubles" value={data.nbImmeubles} />
      <Kpi label="Lots" value={data.nbLots} />
      <Kpi label="Taux d'occupation" value={`${data.tauxOccupation} %`} />
      <Kpi label="Loyers / mois" value={`${data.loyerMensuelTotal} €`} />
      <Kpi
        label="Alertes conformité"
        value={`${data.alertes.rouge} rouges / ${data.alertes.orange} oranges`}
      />
    </div>
  );
}
