import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../../../../components/ui/card';
import { useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import moment from 'moment';
import Page from '../../../../../components/Page';
import { QueryKeys } from '../../../../../utils/restcalls';
import { StoreContext } from '../../../../../store';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { withAuthentication } from '../../../../../components/Authentication';

const MODELES = [
  { id: 'studio', label: 'Studio' },
  { id: 'appart-vide', label: 'Appartement vide' },
  { id: 'appart-meuble', label: 'Appartement meublé' },
  { id: 'maison', label: 'Maison' },
  { id: 'chambre-coloc', label: 'Chambre en colocation' }
];

function ConfigurerLot() {
  const store = useContext(StoreContext);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { lotId } = router.query;

  const [modele, setModele] = useState('appart-meuble');
  const [typeLocation, setTypeLocation] = useState('entier');
  const [applying, setApplying] = useState(false);

  const [newDossier, setNewDossier] = useState({
    type: 'entree',
    locataireId: '',
    chambreId: '',
    expiresInDays: 30
  });
  const [creatingDossier, setCreatingDossier] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: [QueryKeys.EDL_CONFIGURATION, lotId],
    queryFn: async () => {
      if (!lotId) {
        return null;
      }
      const response = await store.edl.fetchConfiguration(lotId);
      return response.status === 200 ? response.data : null;
    },
    enabled: !!lotId
  });

  const applyModele = async () => {
    setApplying(true);
    const { status } = await store.edl.appliquerModele({
      lotId,
      modeleDepartId: modele,
      typeLocation
    });
    setApplying(false);
    if (status >= 400) {
      toast.error('Erreur lors de l\'application du modèle');
      return;
    }
    toast.success('Modèle appliqué');
    queryClient.invalidateQueries({
      queryKey: [QueryKeys.EDL_CONFIGURATION, lotId]
    });
  };

  const creerDossier = async () => {
    if (!newDossier.locataireId) {
      toast.error('Identifiant locataire requis');
      return;
    }
    if (config?.typeLocation === 'colocation' && !newDossier.chambreId) {
      toast.error('chambreId requis pour une colocation');
      return;
    }
    setCreatingDossier(true);
    const { status, data } = await store.edl.creerDossier({
      lotId,
      locataireId: newDossier.locataireId,
      chambreId: newDossier.chambreId || undefined,
      type: newDossier.type,
      expiresInDays: Number(newDossier.expiresInDays) || 30
    });
    setCreatingDossier(false);
    if (status >= 400) {
      toast.error('Erreur lors de la création du dossier');
      return;
    }
    toast.success('Dossier créé');
    queryClient.invalidateQueries({ queryKey: [QueryKeys.EDL_DOSSIERS] });
    // Copy link to clipboard immediately for convenience
    try {
      const url = `${window.location.origin}/edl/parcours/${data.lienToken}`;
      await navigator.clipboard.writeText(url);
      toast.success('Lien du parcours copié');
    } catch (e) {
      // ignore clipboard errors
    }
  };

  return (
    <Page loading={isLoading} dataCy="edlConfigurer">
      <h1 className="text-2xl font-semibold mb-4">
        Configuration EDL — lot {lotId}
      </h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Modèle de départ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="modele">Modèle</Label>
              <select
                id="modele"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={modele}
                onChange={(e) => setModele(e.target.value)}
              >
                {MODELES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="typeLocation">Type de location</Label>
              <select
                id="typeLocation"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={typeLocation}
                onChange={(e) => setTypeLocation(e.target.value)}
              >
                <option value="entier">Logement entier</option>
                <option value="colocation">Colocation</option>
              </select>
            </div>
          </div>
          <Button onClick={applyModele} disabled={applying}>
            {applying ? 'Application…' : 'Appliquer le modèle'}
          </Button>
        </CardContent>
      </Card>

      {config && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>
              Pièces configurées ({config.pieces?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {(config.pieces || []).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-1 border-b"
              >
                <span>
                  {p.nomPersonnalise || p.nom}{' '}
                  <span className="text-xs text-muted-foreground">
                    ({p.type}
                    {p.estPrivative ? ', privative' : ''})
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {(p.equipements?.length || 0)} équipements
                </span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-3">
              Dernière mise à jour :{' '}
              {config.updatedAt
                ? moment(config.updatedAt).format('DD/MM/YYYY HH:mm')
                : '—'}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nouveau dossier EDL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newDossier.type}
                onChange={(e) =>
                  setNewDossier({ ...newDossier, type: e.target.value })
                }
              >
                <option value="entree">Entrée</option>
                <option value="sortie">Sortie</option>
              </select>
            </div>
            <div>
              <Label htmlFor="locataireId">Identifiant locataire</Label>
              <Input
                id="locataireId"
                value={newDossier.locataireId}
                onChange={(e) =>
                  setNewDossier({
                    ...newDossier,
                    locataireId: e.target.value
                  })
                }
              />
            </div>
            {config?.typeLocation === 'colocation' && (
              <div>
                <Label htmlFor="chambreId">
                  Chambre (id — colocation obligatoire)
                </Label>
                <Input
                  id="chambreId"
                  value={newDossier.chambreId}
                  onChange={(e) =>
                    setNewDossier({
                      ...newDossier,
                      chambreId: e.target.value
                    })
                  }
                />
              </div>
            )}
            <div>
              <Label htmlFor="expiresInDays">Expiration du lien (jours)</Label>
              <Input
                id="expiresInDays"
                type="number"
                value={newDossier.expiresInDays}
                onChange={(e) =>
                  setNewDossier({
                    ...newDossier,
                    expiresInDays: e.target.value
                  })
                }
              />
            </div>
          </div>
          <Button onClick={creerDossier} disabled={creatingDossier}>
            {creatingDossier ? 'Création…' : 'Créer le dossier'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Le lien sécurisé sera automatiquement copié dans le presse-papier.
          </p>
        </CardContent>
      </Card>
    </Page>
  );
}

export default withAuthentication(ConfigurerLot);
