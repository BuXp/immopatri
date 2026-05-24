import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table';
import { useContext, useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { StoreContext } from '../../store';
import { toast } from 'sonner';

const STATUTS = ['appele', 'paye', 'impaye', 'en_attente'];

// Copropriété panel (DAT Sprint 4): syndic info, charge calls (CRUD) and a
// simulator that distributes a charge call across the lots by tantièmes.
export default function CoproprieteSection({ immeuble, onChanged }) {
  const store = useContext(StoreContext);
  const [montant, setMontant] = useState('');
  const [lignes, setLignes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appels, setAppels] = useState([]);
  const [savingAppels, setSavingAppels] = useState(false);
  const md = immeuble.modeDetention || {};

  useEffect(() => {
    setAppels(
      (immeuble.appelsCharges || []).map((appel) => ({
        periode: appel.periode || '',
        montant: appel.montant ?? '',
        statut: appel.statut || 'en_attente',
        dateEnvoi: appel.dateEnvoi
          ? new Date(appel.dateEnvoi).toISOString().slice(0, 10)
          : ''
      }))
    );
  }, [immeuble.appelsCharges]);

  const addAppel = () =>
    setAppels((prev) => [
      ...prev,
      { periode: '', montant: '', statut: 'en_attente', dateEnvoi: '' }
    ]);

  const updateAppel = (index, field, value) =>
    setAppels((prev) =>
      prev.map((appel, i) =>
        i === index ? { ...appel, [field]: value } : appel
      )
    );

  const removeAppel = (index) =>
    setAppels((prev) => prev.filter((_, i) => i !== index));

  const saveAppels = async () => {
    setSavingAppels(true);
    const appelsCharges = appels.map((appel) => ({
      periode: appel.periode,
      montant: appel.montant === '' ? undefined : Number(appel.montant),
      statut: appel.statut,
      dateEnvoi: appel.dateEnvoi || undefined
    }));
    const { status } = await store.immeuble.update({
      ...immeuble,
      appelsCharges
    });
    setSavingAppels(false);
    if (status !== 200) {
      toast.error("Erreur lors de l'enregistrement des appels de charges");
      return;
    }
    toast.success('Appels de charges enregistrés');
    onChanged?.();
  };

  const handleRepartir = async () => {
    const value = Number(montant);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Saisissez un montant valide');
      return;
    }
    setLoading(true);
    const { status, data } = await store.immeuble.repartition(
      immeuble._id,
      value
    );
    setLoading(false);
    if (status !== 200) {
      toast.error('Erreur lors du calcul de la répartition');
      return;
    }
    setLignes(data.lignes);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Copropriété</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div>Syndic : {md.syndic || '—'}</div>
          <div>N° lot copro : {md.numLotCopro || '—'}</div>
          <div>Contact : {md.contactSyndic || '—'}</div>
          <div>Email : {md.emailSyndic || '—'}</div>
          <div>Tantièmes : {md.tantiemes ?? '—'}</div>
          <div>
            Charges copro / an :{' '}
            {md.chargesCoproAnnuelles != null
              ? `${md.chargesCoproAnnuelles} €`
              : '—'}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Appels de charges</p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={addAppel}
            >
              <LuPlus className="size-4" />
              Ajouter
            </Button>
          </div>
          {appels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun appel de charges.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Montant (€)</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Envoyé le</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {appels.map((appel, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={appel.periode}
                        onChange={(event) =>
                          updateAppel(index, 'periode', event.target.value)
                        }
                        placeholder="2026-T1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={appel.montant}
                        onChange={(event) =>
                          updateAppel(index, 'montant', event.target.value)
                        }
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        className="flex h-10 rounded-md border border-input bg-background px-2 text-sm"
                        value={appel.statut}
                        onChange={(event) =>
                          updateAppel(index, 'statut', event.target.value)
                        }
                      >
                        {STATUTS.map((statut) => (
                          <option key={statut} value={statut}>
                            {statut}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={appel.dateEnvoi}
                        onChange={(event) =>
                          updateAppel(index, 'dateEnvoi', event.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAppel(index)}
                      >
                        <LuTrash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-2">
            <Button onClick={saveAppels} disabled={savingAppels}>
              Enregistrer les appels
            </Button>
          </div>
        </div>

        <div className="rounded-md border p-3 grid gap-3">
          <p className="text-sm font-medium">
            Répartition d&apos;un appel de charges par lot
          </p>
          <div className="flex items-end gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="montant-repartition">Montant (€)</Label>
              <Input
                id="montant-repartition"
                type="number"
                value={montant}
                onChange={(event) => setMontant(event.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={handleRepartir} disabled={loading}>
              Répartir
            </Button>
          </div>
          {lignes &&
            (lignes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot</TableHead>
                    <TableHead>Tantièmes</TableHead>
                    <TableHead>Quote-part</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((ligne) => (
                    <TableRow key={ligne.lotId}>
                      <TableCell>{ligne.name || ligne.lotId}</TableCell>
                      <TableCell>{ligne.tantiemes}</TableCell>
                      <TableCell>{ligne.quotePart} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun lot à répartir.
              </p>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
