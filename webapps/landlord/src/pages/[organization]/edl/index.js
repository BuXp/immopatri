import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../../../components/ui/table';
import { useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import Link from 'next/link';
import moment from 'moment';
import Page from '../../../../components/Page';
import { QueryKeys } from '../../../../utils/restcalls';
import { StoreContext } from '../../../../store';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../../components/Authentication';

const STATUT_LABELS = {
  a_envoyer: { label: 'À envoyer', variant: 'secondary' },
  en_cours: { label: 'En cours', variant: 'default' },
  transmis: { label: 'Transmis', variant: 'secondary' },
  a_completer: { label: 'À compléter', variant: 'destructive' },
  finalise: { label: 'Finalisé', variant: 'default' },
  signe: { label: 'Signé', variant: 'default' }
};

function StatutBadge({ statut }) {
  const def = STATUT_LABELS[statut] || { label: statut, variant: 'secondary' };
  return <Badge variant={def.variant}>{def.label}</Badge>;
}

function EdlDashboard() {
  // Translation hook kept for consistency with the other pages, even though
  // this screen uses French copy directly (same as the rapprochement screen).
  // eslint-disable-next-line no-unused-vars
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [copying, setCopying] = useState(null);

  const { data: dossiers = [], isLoading } = useQuery({
    queryKey: [QueryKeys.EDL_DOSSIERS],
    queryFn: async () => {
      const response = await store.edl.fetchDossiers();
      return response.data || [];
    }
  });

  const copyLien = async (dossier) => {
    const url = `${window.location.origin}/edl/parcours/${dossier.lienToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopying(dossier._id);
      toast.success('Lien copié dans le presse-papier');
      setTimeout(() => setCopying(null), 2000);
    } catch (e) {
      toast.error('Impossible de copier le lien');
    }
  };

  const lancerComparaison = async (dossier) => {
    // We need to pair this sortie with its entrée dossier for the same lot
    // (+ same locataire + same chambre in coloc). Done server-side; here we
    // forward the ids after a lookup. For simplicity v1 we delegate choice
    // to the owner via a small prompt — a richer picker belongs to a later
    // iteration.
    const entreeId = window.prompt(
      "Identifiant du dossier d'entrée à comparer avec cette sortie :"
    );
    if (!entreeId) {
      return;
    }
    const { status, data } = await store.edl.creerComparaison({
      dossierEntreeId: entreeId,
      dossierSortieId: dossier._id
    });
    if (status >= 400) {
      toast.error('Erreur lors du lancement de la comparaison');
      return;
    }
    router.push(
      `/${router.query.organization}/edl/comparaison/${data._id}`
    );
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: [QueryKeys.EDL_DOSSIERS] });

  return (
    <Page loading={isLoading} dataCy="edlDashboard">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">États des lieux</h1>
        <Button variant="outline" onClick={refresh}>
          Rafraîchir
        </Button>
      </div>

      {dossiers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun dossier pour le moment. Configurez un lot depuis la page du
          lot puis créez un dossier d&apos;entrée ou de sortie.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lot</TableHead>
              <TableHead>Locataire</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead>Progression</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dossiers.map((d) => (
              <TableRow key={d._id}>
                <TableCell>{d.lotId}</TableCell>
                <TableCell>{d.locataireId}</TableCell>
                <TableCell className="capitalize">{d.type}</TableCell>
                <TableCell>
                  <StatutBadge statut={d.statut} />
                </TableCell>
                <TableCell>
                  {d.dateCreation
                    ? moment(d.dateCreation).format('DD/MM/YYYY')
                    : '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {d.resume
                    ? `${d.resume.renseignees}/${d.resume.renseignees + d.resume.nonRenseignees} renseignées`
                    : '—'}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLien(d)}
                  >
                    {copying === d._id ? 'Copié' : 'Copier le lien'}
                  </Button>
                  <Link
                    href={`/${router.query.organization}/edl/comparaison/_new?dossier=${d._id}`}
                    legacyBehavior
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        lancerComparaison(d);
                      }}
                      disabled={d.type !== 'sortie' || d.statut !== 'finalise'}
                    >
                      Comparer
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <p className="text-xs text-muted-foreground mt-6">
        L&apos;IA aide à repérer les écarts. Seul le propriétaire décide.
        Aucun montant n&apos;est calculé automatiquement.
      </p>
    </Page>
  );
}

export default withAuthentication(EdlDashboard);
