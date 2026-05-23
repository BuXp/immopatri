import { fetchAlertes, QueryKeys } from '../../../utils/restcalls';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../../components/ui/table';
import { useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AlerteBadge from '../../../components/alertes/AlerteBadge';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import { LuRefreshCw } from 'react-icons/lu';
import moment from 'moment';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { withAuthentication } from '../../../components/Authentication';

function ConformiteFilters({ niveau, setNiveau, type, setType }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <select
        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={niveau}
        onChange={(event) => setNiveau(event.target.value)}
      >
        <option value="">Tous les niveaux</option>
        <option value="rouge">Rouge</option>
        <option value="orange">Orange</option>
      </select>
      <select
        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={type}
        onChange={(event) => setType(event.target.value)}
      >
        <option value="">Tous les types</option>
        <option value="dpe">DPE</option>
        <option value="dpe_loi_climat">DPE Loi Climat</option>
        <option value="amiante">Amiante</option>
        <option value="plomb">Plomb</option>
        <option value="electricite">Électricité</option>
        <option value="gaz">Gaz</option>
        <option value="erp">ERP</option>
        <option value="carrez">Carrez</option>
        <option value="termites">Termites</option>
        <option value="assainissement">Assainissement</option>
        <option value="bruit">Bruit</option>
      </select>
    </div>
  );
}

function Conformite() {
  const store = useContext(StoreContext);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = router.query;
  const [niveau, setNiveau] = useState('');
  const [type, setType] = useState('');
  const [scanning, setScanning] = useState(false);

  const { data, isError, isLoading } = useQuery({
    queryKey: [QueryKeys.ALERTES, niveau, type],
    queryFn: () => fetchAlertes(store, { niveau, type })
  });

  if (isError) {
    toast.error('Erreur lors du chargement des alertes');
  }

  const alertes = data || [];

  const handleScan = async () => {
    setScanning(true);
    const { status, data: summary } = await store.alerte.scan();
    setScanning(false);
    if (status !== 200) {
      toast.error('Erreur lors du scan de conformité');
      return;
    }
    toast.success(
      `Scan terminé : ${summary.detected} alerte(s) sur ${summary.scanned} lot(s)`
    );
    queryClient.invalidateQueries({ queryKey: [QueryKeys.ALERTES] });
  };

  const handleAcknowledge = async (id) => {
    const { status } = await store.alerte.acknowledge(id);
    if (status !== 200) {
      toast.error("Erreur lors de l'acquittement");
      return;
    }
    queryClient.invalidateQueries({ queryKey: [QueryKeys.ALERTES] });
  };

  return (
    <Page
      loading={isLoading}
      dataCy="conformitePage"
      ActionBar={
        <div className="flex justify-end p-2 md:p-0">
          <Button className="gap-2" onClick={handleScan} disabled={scanning}>
            <LuRefreshCw className="size-4" />
            Scanner la conformité
          </Button>
        </div>
      }
    >
      <h1 className="text-2xl font-semibold mb-4">Conformité</h1>
      <ConformiteFilters
        niveau={niveau}
        setNiveau={setNiveau}
        type={type}
        setType={setType}
      />
      {alertes.length === 0 ? (
        <p className="text-muted-foreground">
          Aucune alerte. Lancez un scan pour détecter les diagnostics expirés ou
          arrivant à échéance.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Niveau</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Lot</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {alertes.map((alerte) => (
              <TableRow key={alerte._id}>
                <TableCell>
                  <AlerteBadge niveau={alerte.niveau} />
                </TableCell>
                <TableCell>{alerte.type}</TableCell>
                <TableCell>{alerte.message}</TableCell>
                <TableCell>
                  {alerte.dateExpiration
                    ? moment(alerte.dateExpiration).format('ll')
                    : '—'}
                </TableCell>
                <TableCell>
                  {alerte.lotId ? (
                    <Link
                      href={`/${organization}/properties/${alerte.lotId}`}
                      className="text-primary hover:underline"
                    >
                      Voir le lot
                    </Link>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAcknowledge(alerte._id)}
                  >
                    Acquitter
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Page>
  );
}

export default withAuthentication(Conformite);
