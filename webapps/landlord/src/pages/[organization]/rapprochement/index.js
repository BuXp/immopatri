import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../../components/ui/table';
import { useContext, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import moment from 'moment';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import { withAuthentication } from '../../../components/Authentication';

function Rapprochement() {
  const store = useContext(StoreContext);
  const now = moment();
  const [csv, setCsv] = useState('');
  const [year, setYear] = useState(now.year());
  const [month, setMonth] = useState(now.month() + 1);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result || ''));
    reader.readAsText(file);
  };

  const handleAnalyse = async () => {
    if (!csv.trim()) {
      toast.error('Collez ou importez un relevé CSV');
      return;
    }
    setAnalyzing(true);
    const { status, data } = await store.rapprochement.analyse({
      csv,
      year,
      month
    });
    setAnalyzing(false);
    if (status !== 200) {
      toast.error("Erreur lors de l'analyse du relevé");
      return;
    }
    setResult(data);
    setSelected(new Set(data.matches.map((_, index) => index)));
  };

  const toggle = (index) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });

  const handleApply = async () => {
    const termStr = `${year}${String(month).padStart(2, '0')}0100`;
    const toApply = result.matches.filter((_, index) => selected.has(index));
    if (!toApply.length) {
      toast.error('Aucun paiement sélectionné');
      return;
    }
    setApplying(true);
    let ok = 0;
    for (const match of toApply) {
      const { status } = await store.rent.pay(termStr, {
        _id: match.tenantId,
        payments: [
          {
            date: match.transaction.date,
            amount: match.transaction.amount,
            type: 'transfer',
            reference: match.transaction.label,
            description: 'Rapprochement bancaire'
          }
        ]
      });
      if (status === 200) {
        ok += 1;
      }
    }
    setApplying(false);
    toast.success(`${ok}/${toApply.length} paiement(s) enregistré(s)`);
    setResult(null);
    setSelected(new Set());
  };

  return (
    <Page dataCy="rapprochementPage">
      <h1 className="text-2xl font-semibold mb-4">Rapprochement bancaire</h1>

      <div className="grid gap-3 mb-4 max-w-2xl">
        <div className="flex gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="rapp-mois">Mois</Label>
            <Input
              id="rapp-mois"
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              className="w-24"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rapp-annee">Année</Label>
            <Input
              id="rapp-annee"
              type="number"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="w-28"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rapp-csv">Relevé bancaire (CSV)</Label>
          <textarea
            id="rapp-csv"
            className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            placeholder="Date;Libellé;Montant&#10;01/02/2026;VIREMENT Dupont loyer;1 200,50"
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
          />
          <Input type="file" accept=".csv,text/csv" onChange={handleFile} />
        </div>
        <div>
          <Button onClick={handleAnalyse} disabled={analyzing}>
            Analyser
          </Button>
        </div>
      </div>

      {result && (
        <div className="grid gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">
                Correspondances ({result.matchedCount})
              </h2>
              <Button
                onClick={handleApply}
                disabled={applying || result.matchedCount === 0}
              >
                Enregistrer les paiements
              </Button>
            </div>
            {result.matches.length === 0 ? (
              <p className="text-muted-foreground">
                Aucune correspondance trouvée.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead />
                    <TableHead>Date</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Locataire</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.matches.map((match, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(index)}
                          onCheckedChange={() => toggle(index)}
                        />
                      </TableCell>
                      <TableCell>{match.transaction.date}</TableCell>
                      <TableCell>{match.transaction.label}</TableCell>
                      <TableCell>{match.transaction.amount} €</TableCell>
                      <TableCell>{match.tenantName}</TableCell>
                      <TableCell>{match.score}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">
              Transactions non rapprochées ({result.unmatchedCount})
            </h2>
            {result.unmatched.length === 0 ? (
              <p className="text-muted-foreground">Aucune.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.unmatched.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.label}</TableCell>
                      <TableCell>{transaction.amount} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}

export default withAuthentication(Rapprochement);
