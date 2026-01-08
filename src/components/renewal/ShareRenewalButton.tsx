import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, MessageCircle, Link } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Patient {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
}

interface CheckinData {
  id: string;
  peso: string;
  medida: string;
  data_checkin: string;
  created_at: string;
}

interface ShareRenewalButtonProps {
  patient: Patient;
  checkins: CheckinData[];
}

export function ShareRenewalButton({ patient, checkins }: ShareRenewalButtonProps) {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const generateRenewalLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/public/renewal/${patient.telefone}`;
  };

  const generateWhatsAppMessage = () => {
    const patientName = patient.nome.split(' ')[0];
    const renewalLink = generateRenewalLink();
    
    return `Oi ${patientName}! 👋

Preparei um relatório especial da sua evolução para nossa conversa de renovação. 

Dá uma olhada aqui: ${renewalLink}

Sua transformação está incrível! Vamos conversar sobre os próximos passos? 🚀

*Fabricio Moura*`;
  };

  const handleCopyLink = async () => {
    try {
      const link = generateRenewalLink();
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Link copiado!',
        description: 'O link da renovação foi copiado para a área de transferência',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link',
        variant: 'destructive',
      });
    }
  };

  const handleWhatsAppShare = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/55${patient.telefone.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: 'WhatsApp aberto!',
      description: 'Mensagem preparada para envio',
    });
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${patient.nome} - Relatório de Evolução 2025`);
    const body = encodeURIComponent(`Olá ${patient.nome.split(' ')[0]}!

Preparei um relatório especial da sua evolução para nossa conversa de renovação.

Acesse aqui: ${generateRenewalLink()}

Sua transformação está incrível! Vamos conversar sobre os próximos passos?

Fabricio Moura`);
    
    const emailUrl = `mailto:${patient.email || ''}?subject=${subject}&body=${body}`;
    window.open(emailUrl);
    
    toast({
      title: 'Email preparado!',
      description: 'Cliente de email aberto com a mensagem',
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        setIsSharing(true);
        await navigator.share({
          title: `Relatório de Evolução - ${patient.nome}`,
          text: `Confira a evolução incrível de ${patient.nome.split(' ')[0]}!`,
          url: generateRenewalLink(),
        });
        
        toast({
          title: 'Compartilhado!',
          description: 'Relatório compartilhado com sucesso',
        });
      } catch (error) {
        // Usuário cancelou o compartilhamento
      } finally {
        setIsSharing(false);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
          disabled={isSharing}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleWhatsAppShare}>
          <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
          Enviar por WhatsApp
        </DropdownMenuItem>
        
        {patient.email && (
          <DropdownMenuItem onClick={handleEmailShare}>
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Enviar por Email
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleCopyLink}>
          <Copy className="w-4 h-4 mr-2 text-slate-400" />
          Copiar Link
        </DropdownMenuItem>
        
        {navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Link className="w-4 h-4 mr-2 text-purple-500" />
            Compartilhar...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}