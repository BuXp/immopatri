import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import {
  fetchProprietairePatrimoine,
  QueryKeys
} from '../../../utils/restcalls';
import {
  proprietaireDisplayName,
  proprietaireInitials
} from '../../../utils/proprietaire';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../../../components/ui/tabs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { downloadDocument } from '../../../utils/fetch';
import EntityDocuments from '../../../components/EntityDocuments';
import Link from 'next/link';
import { LuChevronRight } from 'react-icons/lu';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import { useContext } from 'react';
import { useRouter } from 'next/router';
import { withAuthentication } from '../../../components/Authentication';

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ProprietaireDetail() {
  const store = useContext(StoreContext);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization, id } = router.query;

  const { data, isLoading, isError } = useQuery({
    queryKey: [QueryKeys.PROPRIETAIRES, id, 'patrimoine'],
    queryFn: () => fetchProprietairePatrimoine(store, id),
    enabled: !!id
  });

  const proprietaire = data?.proprietaire || {};

  const handleDocumentsChange = async (documents) => {
    const { status } = await store.proprietaire.update({
      ...proprietaire,
      documents
    });
    if (status !== 200) {
      toast.error('Erreur lors de la mise à jour des documents');
      return;
    }
    queryClient.invalidateQueries({
      queryKey: [QueryKeys.PROPRIETAIRES, id, 'patrimoine']
    });
  };

  const handleExportRgpd = () =>
    downloadDocument({
      endpoint: `/rgpd/proprietaires/${id}/export`,
      documentName: `rgpd-proprietaire-${id}.json`
    });

  const handleAnonymiser = async () => {
    if (
      !window.confirm(
        'Anonymiser ce propriétaire ? Ses données personnelles (nom, contact, IBAN…) seront effacées de façon irréversible.'
      )
    ) {
      return;
    }
    const { status } = await store.proprietaire.anonymiser(id);
    if (status !== 200) {
      toast.error("Erreur lors de l'anonymisation");
      return;
    }
    toast.success('Propriétaire anonymisé');
    queryClient.invalidateQueries({
      queryKey: [QueryKeys.PROPRIETAIRES, id, 'patrimoine']
    });
  };
  const sites = data?.sites || [];
  const immeubles = data?.immeubles || [];
  const lots = data?.lots || [];
  const stats = data?.stats || {};

  return (
    <Page loading={isLoading} dataCy="proprietaireDetailPage">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link
          href={`/${organization}/proprietaires`}
          className="hover:underline"
        >
          Propriétaires
        </Link>
        <LuChevronRight className="size-4" />
        <span className="text-foreground">
          {proprietaireDisplayName(proprietaire)}
        </span>
      </nav>

      {isError ? (
        <p className="text-destructive">
          Erreur lors du chargement du patrimoine.
        </p>
      ) : null}

      <div className="flex items-center gap-3 mb-6">
        <Avatar className="h-14 w-14">
          <AvatarFallback>{proprietaireInitials(proprietaire)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold">
            {proprietaireDisplayName(proprietaire)}
          </h1>
          <Badge variant="secondary">{proprietaire.type || 'physique'}</Badge>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportRgpd}>
            Exporter (RGPD)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnonymiser}
            disabled={proprietaire.anonymise}
          >
            Anonymiser
          </Button>
        </div>
      </div>

      <Tabs defaultValue="biens">
        <TabsList>
          <TabsTrigger value="biens">Biens</TabsTrigger>
          <TabsTrigger value="loyers">Loyers</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="financier">Financier</TabsTrigger>
        </TabsList>

        <TabsContent value="biens">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Stat label="Sites" value={stats.nbSites ?? sites.length} />
            <Stat
              label="Immeubles"
              value={stats.nbImmeubles ?? immeubles.length}
            />
            <Stat label="Lots" value={stats.nbLots ?? lots.length} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map((site) => (
              <Card
                key={site._id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  router.push(`/${organization}/sites/${site._id}`)
                }
              >
                <CardHeader>
                  <CardTitle className="text-lg">{site.nom}</CardTitle>
                  <CardDescription>Site</CardDescription>
                </CardHeader>
              </Card>
            ))}
            {immeubles.map((immeuble) => (
              <Card
                key={immeuble._id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  router.push(`/${organization}/immeubles/${immeuble._id}`)
                }
              >
                <CardHeader>
                  <CardTitle className="text-lg">{immeuble.nom}</CardTitle>
                  <CardDescription>Immeuble</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          {sites.length === 0 && immeubles.length === 0 && lots.length === 0 ? (
            <p className="text-muted-foreground">
              Aucun bien rattaché à ce propriétaire.
            </p>
          ) : null}
        </TabsContent>

        <TabsContent value="loyers">
          {lots.length === 0 ? (
            <p className="text-muted-foreground">Aucun lot rattaché.</p>
          ) : (
            <div className="divide-y rounded-lg border">
              {lots.map((lot) => (
                <div
                  key={lot._id}
                  className="flex items-center justify-between p-3"
                >
                  <span>{lot.name}</span>
                  <span className="text-muted-foreground">
                    {(lot.loyerTotal ?? lot.price ?? 0)} €
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents">
          {proprietaire._id ? (
            <EntityDocuments
              documents={proprietaire.documents || []}
              folder="proprietaires"
              onChange={handleDocumentsChange}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="financier">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Stat
              label="Loyers mensuels attendus"
              value={`${stats.loyerTotalMensuel ?? 0} €`}
            />
            <Stat
              label="Valeur estimée du patrimoine"
              value={`${stats.valeurEstimePatrimoine ?? proprietaire.valeurEstimePatrimoine ?? 0} €`}
            />
          </div>
        </TabsContent>
      </Tabs>
    </Page>
  );
}

export default withAuthentication(ProprietaireDetail);
