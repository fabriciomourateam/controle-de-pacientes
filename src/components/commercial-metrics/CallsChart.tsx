import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CallsData {
  date: string;
  scheduled: number;
  completed: number;
}

interface CallsChartProps {
  data: CallsData[];
}

export function CallsChart({ data }: CallsChartProps) {
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
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Calls por Dia
        </CardTitle>
        <CardDescription className="text-slate-400">
          Calls agendadas vs completadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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
              <Bar 
                dataKey="scheduled" 
                fill="#3b82f6" 
                name="Agendadas"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="completed" 
                fill="#10b981" 
                name="Completadas"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
