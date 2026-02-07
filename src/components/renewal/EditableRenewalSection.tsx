import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from './RichTextEditor';
import { useRenewalCustomContent } from '@/hooks/use-renewal-custom-content';
import { 
  Edit3, 
  Save, 
  RotateCcw, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EditableRenewalSectionProps {
  patientTelefone: string;
  sectionKey: 'summary_content' | 'achievements_content' | 'improvement_areas_content' | 'highlights_content' | 'next_cycle_goals_content';
  title: string;
  icon: React.ReactNode;
  defaultContent: string;
  placeholder?: string;
  className?: string;
  cardClassName?: string;
  isPublicAccess?: boolean;
  /** Controle "visível / oculto no portal público" (ex.: card "Sua Evolução") */
  portalVisibility?: { visible: boolean; onToggle: () => void; loading?: boolean };
}

export function EditableRenewalSection({
  patientTelefone,
  sectionKey,
  title,
  icon,
  defaultContent,
  placeholder,
  className,
  cardClassName,
  isPublicAccess = false,
  portalVisibility
}: EditableRenewalSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { 
    getSectionContent, 
    hasSectionContent, 
    saveSectionContent, 
    resetSectionContent,
    saving 
  } = useRenewalCustomContent(patientTelefone);

  const customContent = getSectionContent(sectionKey);
  const hasCustomContent = hasSectionContent(sectionKey);
  const displayContent = customContent || defaultContent;

  const handleSave = async (content: string) => {
    const success = await saveSectionContent(sectionKey, content);
    if (success) {
      setIsEditing(false);
    }
    return success;
  };

  const handleReset = async () => {
    const success = await resetSectionContent(sectionKey);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Se for acesso público, mostrar apenas o conteúdo sem opções de edição
  if (isPublicAccess) {
    return (
      <Card className={cn("bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-700/80 border-slate-600/50 backdrop-blur-sm shadow-2xl", cardClassName)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl border border-yellow-500/30">
                {icon}
              </div>
              <div>
                <CardTitle className="text-2xl text-white font-bold">
                  {title}
                </CardTitle>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className={className}>
          <div 
            className="prose prose-invert max-w-none text-slate-200 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />
        </CardContent>
      </Card>
    );
  }

  // Modo de edição
  if (isEditing) {
    return (
      <div className="space-y-3 w-full">
        <Card className={cn("bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-700/80 border-slate-600/50 backdrop-blur-sm shadow-2xl", cardClassName)}>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg border border-yellow-500/30 flex-shrink-0">
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg text-white font-bold">
                    Editando: {title}
                  </CardTitle>
                  <p className="text-slate-400 text-xs mt-1">
                    Personalize o conteúdo que será enviado ao paciente
                  </p>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 flex-shrink-0 text-xs">
                  <Edit3 className="w-3 h-3 mr-1" />
                  Editando
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="w-full">
          <RichTextEditor
            content={displayContent}
            placeholder={placeholder || `Digite o conteúdo personalizado para "${title}"...`}
            onSave={handleSave}
            onCancel={handleCancel}
            minHeight="250px"
            className="w-full"
          />
        </div>
      </div>
    );
  }

  // Modo de visualização com controles de edição
  return (
    <Card className={cn("bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-700/80 border-slate-600/50 backdrop-blur-sm shadow-2xl", cardClassName)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl border border-yellow-500/30">
              {icon}
            </div>
            <div>
              <CardTitle className="text-2xl text-white font-bold">
                {title}
              </CardTitle>
              {hasCustomContent && (
                <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Conteúdo personalizado ativo
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasCustomContent && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Personalizado
              </Badge>
            )}
            
            <div className="flex items-center gap-1">
              {!isPublicAccess && portalVisibility && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={portalVisibility.onToggle}
                      disabled={portalVisibility.loading}
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                      title={portalVisibility.visible ? 'Card visível no portal público. Clique para ocultar.' : 'Card oculto do portal público. Clique para mostrar.'}
                    >
                      {portalVisibility.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {portalVisibility.visible ? 'Visível no portal' : 'Oculto do portal'}
                  </TooltipContent>
                </Tooltip>
              )}
              {hasCustomContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={saving}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                  title="Resetar para conteúdo padrão"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                title="Editar conteúdo"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={className}>
        <div 
          className="prose prose-invert max-w-none text-slate-200 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
        
        {!hasCustomContent && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Este é o conteúdo padrão. Clique no ícone de edição para personalizar.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}