import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { N8NWebhookService } from '@/lib/n8n-webhook';

export function N8NTestModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [testData, setTestData] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTest = async () => {
    if (!testData.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira dados de teste",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const data = JSON.parse(testData);
      const result = await N8NWebhookService.processN8NData(data);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Dados de teste processados com sucesso!"
        });
        setIsOpen(false);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao processar dados",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "JSON inválido ou erro de processamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sampleData = {
    nome: "João Silva",
    apelido: "João",
    cpf: "123.456.789-00",
    email: "joao@email.com",
    telefone: "(11) 99999-9999",
    genero: "Masculino",
    data_nascimento: "1990-01-01",
    plano: "PREMIUM",
    tempo_acompanhamento: 6,
    vencimento: "2025-06-01",
    valor: 220,
    peso: 80.5,
    objetivo: "Perder peso",
    pontos_treinos: 5,
    pontos_cardios: 4,
    total_pontuacao: 45,
    percentual_aproveitamento: 85.5
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
          Testar n8n
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
        <DialogHeader>
          <DialogTitle>Teste de Conexão n8n</DialogTitle>
          <DialogDescription>
            Teste a conexão com o n8n enviando dados de exemplo
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="test-data">Dados de Teste (JSON)</Label>
            <Textarea
              id="test-data"
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              placeholder="Cole aqui os dados JSON do n8n"
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setTestData(JSON.stringify(sampleData, null, 2))}
              variant="outline"
              size="sm"
            >
              Usar Dados de Exemplo
            </Button>
            <Button
              onClick={handleTest}
              disabled={loading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? "Testando..." : "Testar Conexão"}
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Endpoint:</strong> <code>POST /api/n8n-webhook</code></p>
            <p><strong>URL completa:</strong> <code>https://seu-dominio.com/api/n8n-webhook</code></p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
