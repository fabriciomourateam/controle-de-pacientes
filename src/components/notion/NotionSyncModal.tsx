import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, CheckCircle } from 'lucide-react';
import { syncNotion } from '@/api/sync-notion';

export function NotionSyncModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    if (!apiKey.trim() || !databaseId.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await syncNotion(apiKey.trim(), databaseId.trim());

      if (data.success) {
        setResult(data);
        toast({
          title: "Sucesso",
          description: `${data.imported} de ${data.total} registros sincronizados!`
        });
        
        // Recarregar a página após 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro na sincronização",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao conectar com o Notion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700">
          <Database className="w-4 h-4 mr-2" />
          Sincronizar Notion
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
        <DialogHeader>
          <DialogTitle>Sincronizar com Notion</DialogTitle>
          <DialogDescription>
            Conecte seu banco de dados do Notion para sincronizar os dados
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="api-key">API Key do Notion</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="secret_..."
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Encontre sua API Key em: https://www.notion.so/my-integrations
            </p>
          </div>
          
          <div>
            <Label htmlFor="database-id">Database ID</Label>
            <Input
              id="database-id"
              value={databaseId}
              onChange={(e) => setDatabaseId(e.target.value)}
              placeholder="631cf85b-608d-4c16-93b7-72bfe0822f64"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              ID da sua base de dados do Notion (da URL)
            </p>
          </div>

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="font-medium text-green-800">
                    Sincronização Concluída!
                  </p>
                  <p className="text-sm text-green-600">
                    {result.imported} de {result.total} registros importados
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={handleSync}
              disabled={loading || !apiKey.trim() || !databaseId.trim()}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                'Sincronizar'
              )}
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
