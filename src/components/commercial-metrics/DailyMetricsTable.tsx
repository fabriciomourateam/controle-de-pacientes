import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface LeadsData {
  date: string;
  google: number;
  googleForms: number;
  instagram: number;
  facebook: number;
  seller: number;
  indicacao: number;
  outros: number;
  total: number;
}

interface CallsData {
  date: string;
  scheduled: number;
  completed: number;
}

interface DailyMetricsTableProps {
  data: LeadsData[] | CallsData[];
  type: 'leads' | 'calls';
  title: string;
}

export function DailyMetricsTable({ data, type, title }: DailyMetricsTableProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTotal = () => {
    if (type === 'leads') {
      return (data as LeadsData[]).reduce((sum, item) => sum + item.total, 0);
    } else {
      return (data as CallsData[]).reduce((sum, item) => sum + item.scheduled, 0);
    }
  };

  const getAverage = () => {
    const total = getTotal();
    return data.length > 0 ? Math.round(total / data.length) : 0;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>{title}</span>
          <div className="flex gap-2 text-sm">
            <Badge variant="outline" className="border-slate-600/50 text-slate-300">Total: {getTotal().toLocaleString()}</Badge>
            <Badge variant="outline" className="border-slate-600/50 text-slate-300">Média: {getAverage()}/dia</Badge>
          </div>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Detalhamento diário dos últimos {data.length} dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-slate-700/50">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700/50">
                <TableHead className="text-slate-300">Data</TableHead>
                {type === 'leads' ? (
                  <>
                    <TableHead className="text-center text-slate-300">Google</TableHead>
                    <TableHead className="text-center text-slate-300">Google Forms</TableHead>
                    <TableHead className="text-center text-slate-300">Instagram</TableHead>
                    <TableHead className="text-center text-slate-300">Facebook</TableHead>
                    <TableHead className="text-center text-slate-300">Seller</TableHead>
                    <TableHead className="text-center text-slate-300">Indicação</TableHead>
                    <TableHead className="text-center text-slate-300">Outros</TableHead>
                    <TableHead className="text-center font-semibold text-slate-300">Total</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-center text-slate-300">Agendadas</TableHead>
                    <TableHead className="text-center text-slate-300">Completadas</TableHead>
                    <TableHead className="text-center text-slate-300">Taxa</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(-30).reverse().map((item, index) => {
                if (type === 'leads') {
                  const leadItem = item as LeadsData;
                  return (
                    <TableRow key={index} className="border-slate-700/50">
                      <TableCell className="font-medium text-slate-300">
                        {formatDate(leadItem.date)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">{leadItem.google}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">{leadItem.googleForms}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">{leadItem.instagram}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">{leadItem.facebook}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">{leadItem.seller}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">{leadItem.indicacao}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">{leadItem.outros}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        <Badge variant="default" className="bg-blue-600 text-white">{leadItem.total}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                } else {
                  const callItem = item as CallsData;
                  const completionRate = callItem.scheduled > 0 
                    ? Math.round((callItem.completed / callItem.scheduled) * 100) 
                    : 0;
                  
                  return (
                    <TableRow key={index} className="border-slate-700/50">
                      <TableCell className="font-medium text-slate-300">
                        {formatDate(callItem.date)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">{callItem.scheduled}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">{callItem.completed}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={completionRate >= 80 ? "default" : completionRate >= 60 ? "secondary" : "destructive"}
                          className={completionRate >= 80 ? "bg-green-600 text-white" : completionRate >= 60 ? "bg-slate-700/50 text-slate-300" : "bg-red-600 text-white"}
                        >
                          {completionRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                }
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
