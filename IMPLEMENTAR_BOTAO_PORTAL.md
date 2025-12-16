# 🔧 Como Implementar o Botão "Enviar Portal"

## Passo a Passo para Adicionar o Botão na Lista de Pacientes

---

## 1️⃣ Criar o Componente do Botão

Crie o arquivo: `src/components/patients/SendPortalButton.tsx`

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getOrCreatePatientToken, getPortalUrl } from '@/lib/patient-portal-service';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SendPortalButtonProps {
  telefone: string;
  patientName: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function SendPortalButton({ 
  telefone, 
  patientName,
  variant = 'ghost',
  size = 'sm',
  showLabel = false
}: SendPortalButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [portalUrl, setPortalUrl] = useState('');

  const handleGenerateLink = async () => {
    try {
      setLoading(true);
      
      // Gerar ou recuperar token
      const result = await getOrCreatePatientToken(telefone);
      
      if (!result) {
        toast({
          title: 'Erro',
          description: 'Não foi possível gerar o link do portal',
          variant: 'destructive'
        });
        return;
      }

      // Gerar URL completa
      const url = getPortalUrl(result.token);
      setPortalUrl(url);
      
      // Copiar para clipboard
      await navigator.clipboard.writeText(url);
      setCopied(true);
      
      // Abrir modal com opções
      setModalOpen(true);
      
      toast({
        title: result.isNew ? 'Link gerado!' : 'Link recuperado!',
        description: 'Link copiado para a área de transferência',
      });

      // Reset do ícone de copiado após 2 segundos
      setTimeout(() => setCopied(false), 2000);
      
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o link',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAgain = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      toast({
        title: 'Copiado!',
        description: 'Link copiado novamente',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link',
        variant: 'destructive'
      });
    }
  };

  const handleOpenInNewTab = () => {
    window.open(portalUrl, '_blank');
  };

  const handleSendWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá ${patientName}! 👋\n\n` +
      `Seu portal de acompanhamento está pronto! 🎉\n\n` +
      `Acesse aqui: ${portalUrl}\n\n` +
      `No portal você pode:\n` +
      `✅ Ver seu plano alimentar\n` +
      `✅ Marcar refeições consumidas\n` +
      `✅ Acompanhar sua evolução\n` +
      `✅ Ver gráficos de progresso\n` +
      `✅ Registrar seu peso\n\n` +
      `💡 Dica: Adicione à tela inicial do celular para acesso rápido!\n\n` +
      `Qualquer dúvida, estou à disposição! 😊`
    );
    
    window.open(`https://wa.me/${telefone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={handleGenerateLink}
              disabled={loading}
              className="gap-2"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Smartphone className="w-4 h-4" />
              )}
              {showLabel && (loading ? 'Gerando...' : 'Portal')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Enviar Portal do Paciente</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Modal com opções */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-500" />
              Portal do Paciente
            </DialogTitle>
            <DialogDescription>
              Link gerado para {patientName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* URL */}
            <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg">
              <code className="flex-1 text-xs truncate">{portalUrl}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyAgain}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Ações */}
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={handleSendWhatsApp}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar via WhatsApp
              </Button>

              <Button
                onClick={handleOpenInNewTab}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir em Nova Aba
              </Button>

              <Button
                onClick={handleCopyAgain}
                variant="outline"
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link Novamente
              </Button>
            </div>

            {/* Instruções */}
            <div className="text-xs text-slate-600 space-y-1 p-3 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-900">💡 Instruções para o aluno:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Abrir o link no celular</li>
                <li>Adicionar à tela inicial (PWA)</li>
                <li>Usar como um app nativo</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## 2️⃣ Adicionar o Botão na Lista de Pacientes

No arquivo `src/components/patients/PatientsListNew.tsx`, adicione o botão no menu de ações:

```tsx
// No início do arquivo, adicione o import
import { SendPortalButton } from '@/components/patients/SendPortalButton';

// Dentro do DropdownMenu de cada paciente, adicione:
<DropdownMenuItem asChild>
  <SendPortalButton
    telefone={patient.telefone}
    patientName={patient.nome}
    variant="ghost"
    size="sm"
    showLabel={true}
  />
</DropdownMenuItem>
```

### Exemplo Completo:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <MoreHorizontal className="w-4 h-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => handleViewDetails(patient)}>
      <Eye className="w-4 h-4 mr-2" />
      Ver Detalhes
    </DropdownMenuItem>
    
    {/* ADICIONE AQUI */}
    <DropdownMenuItem asChild>
      <SendPortalButton
        telefone={patient.telefone}
        patientName={patient.nome}
        variant="ghost"
        size="sm"
        showLabel={true}
      />
    </DropdownMenuItem>
    
    <DropdownMenuSeparator />
    
    <DropdownMenuItem onClick={() => handleEdit(patient)}>
      <Edit className="w-4 h-4 mr-2" />
      Editar
    </DropdownMenuItem>
    
    {/* ... outros itens ... */}
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 3️⃣ Adicionar Botão Rápido na Tabela (Opcional)

Se quiser um botão visível direto na tabela:

```tsx
<TableCell>
  <div className="flex items-center gap-2">
    <SendPortalButton
      telefone={patient.telefone}
      patientName={patient.nome}
      variant="outline"
      size="sm"
    />
    
    {/* Outros botões... */}
  </div>
</TableCell>
```

---

## 4️⃣ Verificar Dependências

Certifique-se de que estes arquivos existem:
- ✅ `src/lib/patient-portal-service.ts` (já existe)
- ✅ `src/components/ui/tooltip.tsx`
- ✅ `src/components/ui/dialog.tsx`

---

## 5️⃣ Testar

1. **Abra a lista de pacientes**
2. **Clique no menu de ações** (3 pontinhos)
3. **Clique em "Portal"**
4. **Verifique se:**
   - Link foi copiado
   - Modal abriu
   - Botão WhatsApp funciona
   - Link abre em nova aba

---

## 6️⃣ Personalizar (Opcional)

### Mudar Cores:
```tsx
// Botão verde
<SendPortalButton
  variant="default"
  className="bg-green-600 hover:bg-green-700"
/>

// Botão azul
<SendPortalButton
  variant="default"
  className="bg-blue-600 hover:bg-blue-700"
/>
```

### Mudar Ícone:
```tsx
import { Link, QrCode, Send } from 'lucide-react';

// Use outro ícone
<Link className="w-4 h-4" />
<QrCode className="w-4 h-4" />
<Send className="w-4 h-4" />
```

### Adicionar QR Code (Futuro):
```bash
npm install qrcode.react
```

```tsx
import QRCode from 'qrcode.react';

<QRCode value={portalUrl} size={200} />
```

---

## 7️⃣ Mensagem Personalizada

Edite a mensagem do WhatsApp no componente:

```tsx
const handleSendWhatsApp = () => {
  const message = encodeURIComponent(
    `Olá ${patientName}! 👋\n\n` +
    `[SUA MENSAGEM AQUI]\n\n` +
    `Link: ${portalUrl}`
  );
  
  window.open(`https://wa.me/${telefone}?text=${message}`, '_blank');
};
```

---

## ✅ Pronto!

Agora você tem um botão completo para enviar o portal aos alunos! 🎉

### Próximos Passos:
1. ✅ Testar com um paciente real
2. ✅ Ajustar a mensagem conforme sua necessidade
3. ✅ Adicionar em outros lugares (página de detalhes, etc)
4. ✅ Monitorar o uso dos alunos
