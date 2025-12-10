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

interface LeadsChartProps {
  data: LeadsData[];
}

export function LeadsChart({ data }: LeadsChartProps) {
  const chartData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    })
  }));

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Leads por Dia
        </CardTitle>
        <CardDescription className="text-slate-400">
          Acompanhamento diário de leads por funil
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#64748b' }}
              />
              <YAxis 
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
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="google" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Google"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="googleForms" 
                stroke="#1d4ed8" 
                strokeWidth={2}
                name="Google Forms"
                dot={{ fill: '#1d4ed8', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="instagram" 
                stroke="#e11d48" 
                strokeWidth={2}
                name="Instagram"
                dot={{ fill: '#e11d48', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="facebook" 
                stroke="#1877f2" 
                strokeWidth={2}
                name="Facebook"
                dot={{ fill: '#1877f2', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="seller" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Seller"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="indicacao" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Indicação"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="outros" 
                stroke="#6b7280" 
                strokeWidth={2}
                name="Outros"
                dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                name="Total"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
