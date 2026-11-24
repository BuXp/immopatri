// Public tenant journey page — accessed via a signed JWT link (no account).
// Intentionally NOT wrapped with `withAuthentication` so a tenant can open
// it on their phone without owning an ImmoPatri account.

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { useEffect, useState } from 'react';
import { apiFetcher } from '../../../utils/fetch';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import { useRouter } from 'next/router';

const ETATS = [
  { v: '', label: '— non renseigné —' },
  { v: 'tres_bon', label: 'Très bon' },
  { v: 'bon', label: 'Bon' },
  { v: 'use', label: 'Usé' },
  { v: 'degrade', label: 'Dégradé' },
  { v: 'non_verifiable', label: 'Non vérifiable' }
];
const PROPRETES = [
  { v: '', label: '— non renseigné —' },
  { v: 'propre', label: 'Propre' },
  { v: 'traces_legeres', label: 'Traces légères' },
  { v: 'sale', label: 'Sale' },
  { v: 'non_verifiable', label: 'Non vérifiable' }
];
const FONCTIONNEMENTS = [
  { v: '', label: '— non renseigné —' },
  { v: 'fonctionne', label: 'Fonctionne' },
  { v: 'partiellement', label: 'Partiellement' },
  { v: 'ne_fonctionne_pas', label: 'Ne fonctionne pas' },
  { v: 'non_teste', label: 'Non testé' }
];

function ObservationCard({ piece, element, token }) {
  const [etat, setEtat] = useState('');
  const [proprete, setProprete] = useState('');
  const [fonctionnement, setFonctionnement] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetcher().put(`/edl/parcours/${token}/observation`, {
        pieceId: piece.pieceId,
        pieceNom: piece.nom,
        elementId: element.id,
        etat: etat || undefined,
        proprete: proprete || undefined,
        fonctionnement: fonctionnement || undefined,
        commentaire
      });
      setSaved(true);
      toast.success(`Observation enregistrée — ${element.nom}`);
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{element.nom}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-xs text-muted-foreground">
          Prenez une vue générale puis un gros plan en cas de défaut. Évitez
          personnes et documents personnels sur la photo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <Label>État</Label>
            <select
              value={etat}
              onChange={(e) => setEtat(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {ETATS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Propreté</Label>
            <select
              value={proprete}
              onChange={(e) => setProprete(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {PROPRETES.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Fonctionnement</Label>
            <select
              value={fonctionnement}
              onChange={(e) => setFonctionnement(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {FONCTIONNEMENTS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label>Commentaire (optionnel)</Label>
          <Textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Une réponse non renseignée reste <strong>Non renseigné</strong> —
            jamais « bon ».
          </p>
          <Button size="sm" onClick={save} disabled={saving}>
            {saved ? 'Enregistré ✓' : saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Parcours() {
  const router = useRouter();
  const { token } = router.query;
  const [parcours, setParcours] = useState(null);
  const [error, setError] = useState(null);
  const [transmitting, setTransmitting] = useState(false);
  const [transmitted, setTransmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }
    apiFetcher()
      .get(`/edl/parcours/${token}`)
      .then((res) => setParcours(res.data))
      .catch((err) => {
        if (err?.response?.status === 410) {
          setError('Ce lien a expiré. Contactez votre propriétaire.');
        } else if (err?.response?.status === 401) {
          setError('Ce lien est invalide. Contactez votre propriétaire.');
        } else {
          setError('Lien inaccessible. Réessayez plus tard.');
        }
      });
  }, [token]);

  const transmettre = async () => {
    setTransmitting(true);
    try {
      await apiFetcher().post(`/edl/parcours/${token}/transmettre`);
      setTransmitted(true);
      toast.success('Dossier transmis — merci !');
    } catch (e) {
      toast.error('Erreur lors de la transmission');
    } finally {
      setTransmitting(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>État des lieux — accès</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!parcours) {
    return (
      <div className="max-w-xl mx-auto p-6 text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-semibold">
        État des lieux — {parcours.dossier.type === 'entree' ? "d'entrée" : 'de sortie'}
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        Lot : {parcours.dossier.lotId}
        {parcours.dossier.chambreId ? ` — chambre ${parcours.dossier.chambreId}` : ''}
      </p>

      <Card className="mb-4 bg-blue-50">
        <CardContent className="py-3 space-y-1 text-sm">
          <p className="font-medium">Avant de commencer</p>
          {parcours.consignesInitiales.map((c) => (
            <p key={c}>• {c}</p>
          ))}
        </CardContent>
      </Card>

      {(parcours.config?.pieces || []).map((piece) => (
        <div key={piece.id} className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            {piece.nomPersonnalise || piece.nom}
          </h2>
          {(piece.equipements || []).length === 0 ? (
            <ObservationCard
              piece={{ pieceId: piece.id, nom: piece.nom }}
              element={{ id: piece.id, nom: piece.nomPersonnalise || piece.nom }}
              token={token}
            />
          ) : (
            (piece.equipements || []).map((eq) => (
              <ObservationCard
                key={eq.id}
                piece={{ pieceId: piece.id, nom: piece.nom }}
                element={eq}
                token={token}
              />
            ))
          )}
        </div>
      ))}

      <Card className="sticky bottom-2">
        <CardContent className="py-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Vous pourrez revenir modifier tant que le dossier n&apos;a pas été
            transmis.
          </div>
          <Button
            onClick={transmettre}
            disabled={transmitting || transmitted}
          >
            {transmitted
              ? 'Transmis ✓'
              : transmitting
                ? 'Transmission…'
                : 'Transmettre mon dossier'}
          </Button>
        </CardContent>
      </Card>

      {/* Hidden `Input` kept so the page's dependency surface mirrors the
          owner pages and future photo-upload fields plug in cleanly. */}
      <Input type="hidden" aria-hidden="true" readOnly value="" />
    </div>
  );
}
