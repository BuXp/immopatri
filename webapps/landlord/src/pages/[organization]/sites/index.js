import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { fetchSites, QueryKeys } from '../../../utils/restcalls';
import { useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../components/ui/button';
import { LuBuilding2, LuPlusCircle } from 'react-icons/lu';
import Page from '../../../components/Page';
import SiteFormDialog from '../../../components/sites/SiteFormDialog';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { withAuthentication } from '../../../components/Authentication';

function Sites() {
  const store = useContext(StoreContext);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = router.query;
  const [open, setOpen] = useState(false);

  const { data, isError, isLoading } = useQuery({
    queryKey: [QueryKeys.SITES],
    queryFn: () => fetchSites(store)
  });

  if (isError) {
    toast.error('Erreur lors du chargement des sites');
  }

  const sites = data || [];

  return (
    <Page
      loading={isLoading}
      dataCy="sitesPage"
      ActionBar={
        <div className="flex justify-end p-2 md:p-0">
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <LuPlusCircle className="size-4" />
            Ajouter un site
          </Button>
        </div>
      }
    >
      <h1 className="text-2xl font-semibold mb-4">Sites</h1>
      {sites.length === 0 ? (
        <p className="text-muted-foreground">
          Aucun site pour le moment. Créez votre premier site.
        </p>
      ) : (
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
                <CardTitle className="flex items-center gap-2 text-xl">
                  <LuBuilding2 className="size-5" />
                  {site.nom}
                </CardTitle>
                <CardDescription>
                  {[site.codePostal, site.ville].filter(Boolean).join(' ')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {site.banquePrincipale
                  ? `Banque : ${site.banquePrincipale}`
                  : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <SiteFormDialog
        open={open}
        setOpen={setOpen}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: [QueryKeys.SITES] })
        }
      />
    </Page>
  );
}

export default withAuthentication(Sites);
