import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../../../../components/ui/card';
import { useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import Page from '../../../../../components/Page';
import { QueryKeys } from '../../../../../utils/restcalls';
import { StoreContext } from '../../../../../store';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { withAuthentication } from '../../../../../components/Authentication';

function confidenceBadge(level) {
  if (level < 40) {
    return { variant: 'secondary', label: `Faible (${level})` };
  }
  if (level <= 60) {
    return { variant: 'default', label: `Moyen (${level})` };
  }
  return { variant: 'destructive', label: `Élevé (${level})` };
}

function ValidationComparaison() {
  const store = useContext(StoreContext);
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const [complement, setComplement] = useState({});

  const { data: comparaison, isLoading } = useQuery({
    queryKey: [QueryKeys.EDL_COMPARAISON, id],
    queryFn: async () => {
      if (!id) {
        return null;
      }
      const response = await store.edl.fetchComparaison(id);
      return response.status === 200 ? response.data : null;
    },
    enabled: !!id
  });

  const decide = async (index, action) => {
    const commentaire =
      action === 'complement_demande' ? complement[index] || '' : '';
    if (action === 'complement_demande' && !commentaire.trim()) {
      toast.error('Un commentaire est requis pour demander un complément');
      return;
    }
    const { status } = await store.edl.validerItem(id, index, {
      action,
      commentaire
    });
    if (status >= 400) {
      toast.error('Erreur lors de la validation');
      return;
    }
    queryClient.invalidateQueries({
      queryKey: [QueryKeys.EDL_COMPARAISON, id]
    });
  };

  return (
    <Page loading={isLoading} dataCy="edlComparaison">
      <h1 className="text-2xl font-semibold mb-4">
        Validation de la comparaison
      </h1>

      <div className="rounded-md border p-3 mb-4 bg-amber-50 text-sm">
        <strong>Rappel :</strong> l&apos;IA aide à repérer les écarts. Seul le
        propriétaire décide. Aucun montant n&apos;est calculé automatiquement.
      </div>

      {!comparaison || !comparaison.resultats ? (
        <p className="text-sm text-muted-foreground">
          Aucune comparaison trouvée.
        </p>
      ) : comparaison.resultats.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune différence détectée par l&apos;IA.
        </p>
      ) : (
        <div className="space-y-3">
          {comparaison.resultats.map((r, index) => {
            const conf = confidenceBadge(r.niveauConfiance);
            return (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>
                      {r.typeSignalement} — {r.pieceId}/{r.elementId}
                    </span>
                    <Badge variant={conf.variant}>{conf.label}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{r.descriptionFactuelle || 'Pas de description'}</p>
                  <p className="text-xs text-muted-foreground">
                    Statut :{' '}
                    <span className="font-medium">{r.statutValidation}</span>
                  </p>
                  {r.commentaireProprietaire ? (
                    <p className="text-xs">
                      Commentaire : {r.commentaireProprietaire}
                    </p>
                  ) : null}
                  {r.statutValidation === 'en_attente' && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => decide(index, 'confirme')}
                      >
                        Confirmer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decide(index, 'ecarte')}
                      >
                        Écarter (usure normale)
                      </Button>
                      <div className="flex-1 flex gap-2 min-w-[240px]">
                        <Input
                          placeholder="Raison du complément"
                          value={complement[index] || ''}
                          onChange={(e) =>
                            setComplement({
                              ...complement,
                              [index]: e.target.value
                            })
                          }
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => decide(index, 'complement_demande')}
                        >
                          Demander complément
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {/* `Label` kept imported for consistency with the sibling pages;
          unused here but explicit via a hidden control for schema parity. */}
      <Label className="sr-only">Validation humaine obligatoire</Label>
    </Page>
  );
}

export default withAuthentication(ValidationComparaison);
