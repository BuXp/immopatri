import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { fetchImmeubles, QueryKeys } from '../../../utils/restcalls';
import {
  LuBuilding,
  LuChevronRight,
  LuPencil,
  LuPlusCircle
} from 'react-icons/lu';
import { useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../components/ui/button';
import ImmeubleFormDialog from '../../../components/immeubles/ImmeubleFormDialog';
import Link from 'next/link';
import Page from '../../../components/Page';
import SiteFormDialog from '../../../components/sites/SiteFormDialog';
import { StoreContext } from '../../../store';
import { useRouter } from 'next/router';
import { withAuthentication } from '../../../components/Authentication';

function SiteDetail() {
  const store = useContext(StoreContext);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization, id } = router.query;
  const [openImmeuble, setOpenImmeuble] = useState(false);
  const [openEditSite, setOpenEditSite] = useState(false);

  const siteQuery = useQuery({
    queryKey: [QueryKeys.SITES, id],
    queryFn: async () => (await store.site.fetchOne(id)).data,
    enabled: !!id
  });
  const immeublesQuery = useQuery({
    queryKey: [QueryKeys.IMMEUBLES, id],
    queryFn: () => fetchImmeubles(store, id),
    enabled: !!id
  });

  const site = siteQuery.data || {};
  const immeubles = immeublesQuery.data || [];
  const isLoading = siteQuery.isLoading || immeublesQuery.isLoading;

  return (
    <Page
      loading={isLoading}
      dataCy="siteDetailPage"
      ActionBar={
        <div className="flex justify-end p-2 md:p-0">
          <Button className="gap-2" onClick={() => setOpenImmeuble(true)}>
            <LuPlusCircle className="size-4" />
            Ajouter un immeuble
          </Button>
        </div>
      }
    >
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link href={`/${organization}/sites`} className="hover:underline">
          Sites
        </Link>
        <LuChevronRight className="size-4" />
        <span className="text-foreground">{site.nom}</span>
      </nav>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{site.nom}</CardTitle>
              <CardDescription>
                {[site.adresse, site.codePostal, site.ville]
                  .filter(Boolean)
                  .join(', ')}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setOpenEditSite(true)}
            >
              <LuPencil className="size-4" />
              Modifier
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
          <div>Banque : {site.banquePrincipale || '—'}</div>
          <div>
            Taxe foncière :{' '}
            {site.taxeFonciere != null ? `${site.taxeFonciere} €` : '—'}
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-3">
        Immeubles ({immeubles.length})
      </h2>
      {immeubles.length === 0 ? (
        <p className="text-muted-foreground">
          Aucun immeuble rattaché à ce site.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {immeubles.map((immeuble) => (
            <Card
              key={immeuble._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                router.push(`/${organization}/immeubles/${immeuble._id}`)
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LuBuilding className="size-5" />
                  {immeuble.nom}
                </CardTitle>
                <CardDescription>{immeuble.adresse}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {immeuble.modeDetention?.type || immeuble.type || '—'}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ImmeubleFormDialog
        open={openImmeuble}
        setOpen={setOpenImmeuble}
        siteId={id}
        onSaved={() =>
          queryClient.invalidateQueries({
            queryKey: [QueryKeys.IMMEUBLES, id]
          })
        }
      />
      <SiteFormDialog
        open={openEditSite}
        setOpen={setOpenEditSite}
        site={site}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: [QueryKeys.SITES, id] })
        }
      />
    </Page>
  );
}

export default withAuthentication(SiteDetail);
