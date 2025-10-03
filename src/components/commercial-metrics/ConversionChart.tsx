import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

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

interface ConversionChartProps {
  leadsData: LeadsData[];
  callsData: CallsData[];
}

export function ConversionChart({ leadsData, callsData }: ConversionChartProps) {
  // Combina os dados de leads e calls por data
  const chartData = leadsData.map(leadItem => {
    const callItem = callsData.find(call => call.date === leadItem.date);
    const conversionRate = leadItem.total > 0 ? (callItem?.scheduled || 0) / leadItem.total * 100 : 0;
    
    return {
      date: new Date(leadItem.date).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      }),
      leads: leadItem.total,
      calls: callItem?.scheduled || 0,
      conversionRate: Math.round(conversionRate * 10) / 10, // Arredonda para 1 casa decimal
    };
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          Taxa de Conversão Diária
        </CardTitle>
        <CardDescription className="text-slate-400">
          Percentual de leads que se tornam calls agendadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#64748b' }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#64748b' }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(value, name) => {
                  if (name === 'conversionRate') {
                    return [`${value}%`, 'Taxa de Conversão'];
                  }
                  return [value, name === 'leads' ? 'Leads' : 'Calls'];
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="leads" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Leads"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="calls" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Calls"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="conversionRate" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                name="Taxa de Conversão"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
