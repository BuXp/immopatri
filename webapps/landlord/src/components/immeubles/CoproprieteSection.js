import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table';
import { useContext, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import moment from 'moment';
import { StoreContext } from '../../store';
import { toast } from 'sonner';

// Copropriété panel (DAT Sprint 4): syndic info, charge calls and a simulator
// that distributes a charge call across the building's lots by tantièmes.
export default function CoproprieteSection({ immeuble }) {
  const store = useContext(StoreContext);
  const [montant, setMontant] = useState('');
  const [lignes, setLignes] = useState(null);
  const [loading, setLoading] = useState(false);
  const md = immeuble.modeDetention || {};
  const appels = immeuble.appelsCharges || [];

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

        {appels.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Appels de charges</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Envoyé le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appels.map((appel, index) => (
                  <TableRow key={index}>
                    <TableCell>{appel.periode || '—'}</TableCell>
                    <TableCell>
                      {appel.montant != null ? `${appel.montant} €` : '—'}
                    </TableCell>
                    <TableCell>{appel.statut || '—'}</TableCell>
                    <TableCell>
                      {appel.dateEnvoi
                        ? moment(appel.dateEnvoi).format('ll')
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

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
