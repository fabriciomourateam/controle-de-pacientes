import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getOrCreatePatientToken, getPortalUrl } from '@/lib/patient-portal-service';

interface PortalPNGButtonProps {
  telefone: string;
  patientName: string;
}

export function PortalPNGButton({ telefone, patientName }: PortalPNGButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDownloadPortalPNG = async () => {
    try {
      setLoading(true);
      
      toast({
        title: 'Preparando download...',
        description: 'Gerando o PNG do Portal do Aluno',
      });

      // Obter ou criar token do portal
      const result = await getOrCreatePatientToken(telefone);
      
      if (!result) {
        toast({
          title: 'Erro',
          description: 'Não foi possível gerar o link do portal',
          variant: 'destructive'
        });
        return;
      }

      // Gerar URL do portal com parâmetro de auto-download
      const portalUrl = getPortalUrl(result.token);
      const downloadUrl = `${portalUrl}?autoDownload=true&name=${encodeURIComponent(patientName)}`;
      
      // Abrir portal em nova aba (ele automaticamente iniciará o download)
      window.open(downloadUrl, '_blank');
      
      toast({
        title: 'Portal aberto! 📸',
        description: 'O download do PNG iniciará automaticamente',
      });
      
    } catch (error) {
      console.error('Erro ao baixar PNG do portal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o PNG do portal',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownloadPortalPNG}
      disabled={loading}
      className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Preparando...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Baixar Portal PNG
        </>
      )}
    </Button>
  );
}

