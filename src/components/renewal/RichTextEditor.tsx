import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Save,
  X,
  RotateCcw,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  placeholder?: string;
  onSave: (content: string) => Promise<boolean>;
  onCancel: () => void;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({ 
  content, 
  placeholder = 'Digite seu texto aqui...', 
  onSave, 
  onCancel,
  className,
  minHeight = '200px'
}: RichTextEditorProps) {
  const [currentContent, setCurrentContent] = useState(content);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      setCurrentContent(editorRef.current.innerHTML);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave(currentContent);
    setSaving(false);
    
    if (success) {
      // Não fechar automaticamente, deixar o usuário decidir
    }
  };

  const handleReset = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
      setCurrentContent(content);
    }
  };

  const isContentChanged = currentContent !== content;

  return (
    <Card className={cn("bg-slate-800/50 border-slate-600", className)}>
      <CardContent className="p-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-2 mb-4 p-2 bg-slate-900/50 rounded-lg border border-slate-700">
          {/* Ferramentas de formatação */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommand('bold')}
                className="h-7 w-7 p-0 hover:bg-slate-700"
                title="Negrito (Ctrl+B)"
              >
                <Bold className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommand('italic')}
                className="h-7 w-7 p-0 hover:bg-slate-700"
                title="Itálico (Ctrl+I)"
              >
                <Italic className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommand('underline')}
                className="h-7 w-7 p-0 hover:bg-slate-700"
                title="Sublinhado (Ctrl+U)"
              >
                <Underline className="w-3 h-3" />
              </Button>
              
              <div className="w-px h-5 bg-slate-600 mx-1" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommand('insertUnorderedList')}
                className="h-7 w-7 p-0 hover:bg-slate-700"
                title="Lista com marcadores"
              >
                <List className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommand('insertOrderedList')}
                className="h-7 w-7 p-0 hover:bg-slate-700"
                title="Lista numerada"
              >
                <ListOrdered className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {/* Botões de ação */}
          <div className="flex items-center justify-end gap-1">
            {isContentChanged && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700"
                title="Desfazer alterações"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Desfazer
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-7 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <X className="w-3 h-3 mr-1" />
              Cancelar
            </Button>
            
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="h-7 px-3 text-xs bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium"
            >
              <Save className="w-3 h-3 mr-1" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={updateContent}
          onKeyDown={(e) => {
            // Atalhos de teclado
            if (e.ctrlKey || e.metaKey) {
              switch (e.key) {
                case 'b':
                  e.preventDefault();
                  handleCommand('bold');
                  break;
                case 'i':
                  e.preventDefault();
                  handleCommand('italic');
                  break;
                case 'u':
                  e.preventDefault();
                  handleCommand('underline');
                  break;
                case 's':
                  e.preventDefault();
                  if (isContentChanged) {
                    handleSave();
                  }
                  break;
              }
            }
          }}
          className={cn(
            "w-full p-4 bg-slate-900/30 border border-slate-700 rounded-lg",
            "text-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-yellow-500/50",
            "prose prose-invert max-w-none",
            "[&_strong]:text-white [&_strong]:font-bold",
            "[&_em]:text-slate-300 [&_em]:italic",
            "[&_u]:underline",
            "[&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2",
            "[&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2",
            "[&_li]:my-1",
            "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"
          )}
          style={{ minHeight }}
          data-placeholder={placeholder}
        />

        {/* Dicas de uso */}
        <div className="mt-3 text-xs text-slate-500">
          <p>
            <strong>Dicas:</strong> Use Ctrl+B para negrito, Ctrl+I para itálico, Ctrl+U para sublinhado, Ctrl+S para salvar.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}