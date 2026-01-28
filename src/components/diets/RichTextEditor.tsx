import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Palette, Link as LinkIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  resizable?: boolean;
}

const colors = [
  { name: 'Preto', value: '#000000' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Roxo', value: '#a855f7' },
  { name: 'Rosa', value: '#ec4899' },
];

export function RichTextEditor({ value, onChange, placeholder, className = '', resizable = false }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Inicializar conteúdo do editor
  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Se clicar em um link com Ctrl/Cmd, abrir em nova aba
    if (target.tagName === 'A' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const href = target.getAttribute('href');
      if (href) {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const applyColor = (color: string) => {
    applyFormat('foreColor', color);
    setColorPickerOpen(false);
  };

  const insertLink = () => {
    if (!linkUrl) return;
    
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    const text = linkText || url;
    
    // Criar link HTML com atributo contenteditable="false" para torná-lo clicável
    const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" contenteditable="false" style="color: #3b82f6; text-decoration: underline; cursor: pointer; padding: 2px 4px; border-radius: 4px; background-color: #eff6ff; display: inline-block; margin: 0 2px;">${text}</a>`;
    
    // Inserir no editor
    document.execCommand('insertHTML', false, linkHtml);
    
    // Limpar e fechar
    setLinkUrl('');
    setLinkText('');
    setLinkDialogOpen(false);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className={`border border-green-500/30 rounded-md bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormat('bold')}
          className="h-8 w-8 p-0 hover:bg-gray-200 text-black"
          title="Negrito (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormat('italic')}
          className="h-8 w-8 p-0 hover:bg-gray-200 text-black"
          title="Itálico (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-200 text-black"
              title="Cor do texto"
            >
              <Palette className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => applyColor(color.value)}
                  className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Popover open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-200 text-black"
              title="Inserir link (Ctrl+Clique para abrir)"
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <div>
                <Label htmlFor="link-text" className="text-sm font-medium">
                  Texto do link
                </Label>
                <Input
                  id="link-text"
                  placeholder="Ex: Clique aqui"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="mt-1 border-green-500/30 bg-white text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div>
                <Label htmlFor="link-url" className="text-sm font-medium">
                  URL *
                </Label>
                <Input
                  id="link-url"
                  placeholder="Ex: https://exemplo.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="mt-1 border-green-500/30 bg-white text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      insertLink();
                    }
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                💡 Dica: Ctrl+Clique no link para abrir
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLinkUrl('');
                    setLinkText('');
                    setLinkDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={insertLink}
                  disabled={!linkUrl}
                  className="bg-[#00C98A] hover:bg-[#00A875] text-white"
                >
                  Inserir
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onMouseDown={handleMouseDown}
        className={`min-h-[100px] p-3 text-[#222222] focus:outline-none focus:ring-0 focus-visible:ring-0 bg-white ${resizable ? 'resize-y overflow-auto' : ''}`}
        data-placeholder={placeholder}
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          maxHeight: resizable ? '500px' : undefined,
        }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #777777;
          pointer-events: none;
        }
        [contenteditable] {
          outline: none;
        }
        [contenteditable] a,
        [contenteditable] .editor-link {
          color: #3b82f6 !important;
          text-decoration: underline !important;
          cursor: pointer !important;
          padding: 2px 4px;
          border-radius: 4px;
          background-color: #eff6ff;
          transition: all 0.2s;
          display: inline-block;
          margin: 0 2px;
        }
        [contenteditable] a:hover,
        [contenteditable] .editor-link:hover {
          color: #2563eb !important;
          background-color: #dbeafe !important;
        }
      `}</style>
    </div>
  );
}
