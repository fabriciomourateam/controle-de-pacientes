import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Upload, X, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { FlowStep } from '@/lib/checkin-flow-default';
import { CheckinFlowTheme, DEFAULT_THEME } from '@/lib/checkin-flow-service';

const ASTER = '[\\*\\uFF0A\\u2022]'; // * ＊ •
/** Converte **texto** em negrito e *texto* em itálico; preserva quebras de linha. Não usa HTML bruto (seguro). */
function renderFormattedText(text: string): React.ReactNode {
  const raw = String(text);
  const parts: React.ReactNode[] = [];
  const reBold = new RegExp(`(?:${ASTER}){2}(.+?)(?:${ASTER}){2}`, 'g');
  let m: RegExpExecArray | null;
  let lastIndex = 0;
  while ((m = reBold.exec(raw)) !== null) {
    parts.push(<React.Fragment key={`pre-${parts.length}`}>{parseItalic(raw.slice(lastIndex, m.index))}</React.Fragment>);
    parts.push(<strong key={`b-${parts.length}`}>{m[1]}</strong>);
    lastIndex = reBold.lastIndex;
  }
  parts.push(<React.Fragment key={`end-${parts.length}`}>{parseItalic(raw.slice(lastIndex))}</React.Fragment>);
  return <span className="whitespace-pre-wrap">{parts}</span>;
}
/** Aplica itálico *texto* em um trecho (já sem **). Conteúdo não pode ter * ＊ •. */
function parseItalic(segment: string): React.ReactNode {
  const reItalic = new RegExp(`${ASTER}([^*\uFF0A\u2022]+)${ASTER}`, 'g');
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let n: RegExpExecArray | null;
  while ((n = reItalic.exec(segment)) !== null) {
    parts.push(segment.slice(lastIndex, n.index));
    parts.push(<em key={`i-${parts.length}`}>{n[1]}</em>);
    lastIndex = reItalic.lastIndex;
  }
  parts.push(segment.slice(lastIndex));
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  isTyping?: boolean;
  imageUrl?: string;
}

export interface ChatCheckinEngineProps {
  flow: FlowStep[];
  patientName: string;
  onComplete: (data: Record<string, string>, photos: File[]) => Promise<void>;
  loading?: boolean;
  theme?: CheckinFlowTheme;
  storageKey?: string;
}

function evaluateCondition(condition: { field: string; operator: string; value: string }, data: Record<string, string>): boolean {
  const fieldValue = data[condition.field] || '';
  const fieldNum = parseFloat(fieldValue) || 0;
  const condValue = condition.value;
  const condNum = parseFloat(condValue) || 0;

  // Handle "Nenhum" as 0
  const effectiveNum = fieldValue === 'Nenhum' ? 0 : fieldNum;

  switch (condition.operator) {
    case '==': return fieldValue === condValue;
    case '!=': return fieldValue !== condValue;
    case '>=': return effectiveNum >= condNum;
    case '<=': return effectiveNum <= condNum;
    case '>': return effectiveNum > condNum;
    case '<': return effectiveNum < condNum;
    case 'between': {
      const [min, max] = condValue.split(',').map(Number);
      return effectiveNum >= min && effectiveNum <= max;
    }
    default: return true;
  }
}

export function ChatCheckinEngine({ flow, patientName, onComplete, loading, theme: customTheme, storageKey }: ChatCheckinEngineProps) {
  const theme = { ...DEFAULT_THEME, ...customTheme };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [data, setData] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [stepMessagesDone, setStepMessagesDone] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [multiInputValues, setMultiInputValues] = useState<Record<string, string>>({});
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const startedRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const addBotMessage = (content: string, imageUrl?: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsTyping(true);
      scrollToBottom();
      const delay = imageUrl ? 400 : Math.min(content.length * 15, 1500);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, type: 'bot', content, imageUrl }]);
        scrollToBottom();
        setTimeout(resolve, 300);
      }, delay);
    });
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, { id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, type: 'user', content }]);
    scrollToBottom();
  };

  // Iniciar o fluxo ou restaurar sessão
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Tentar restaurar sessão anterior
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const {
            data: sData,
            currentStepIndex: sIndex,
            messages: sMessages,
            multiInputValues: sMulti
          } = JSON.parse(saved);

          if (sData && sIndex !== undefined && sMessages?.length > 0) {
            setData(sData);
            setCurrentStepIndex(sIndex);

            // Dedupe messages to prevent key warnings
            const uniqueMessages = sMessages.filter((msg: ChatMessage, index: number, self: ChatMessage[]) =>
              index === self.findIndex((m) => m.id === msg.id)
            );
            setMessages(uniqueMessages);

            if (sMulti) setMultiInputValues(sMulti);

            setStepMessagesDone(true); // Assumir que mensagens do step atual já foram exibidas
            setTimeout(scrollToBottom, 100);
            return;
          }
        }
      } catch (e) {
        console.error('Erro ao restaurar sessão:', e);
      }
    }

    startFlow();
  }, [storageKey]);

  // Salvar progresso
  useEffect(() => {
    if (storageKey && currentStepIndex >= 0 && !isComplete) {
      const stateToSave = {
        data,
        currentStepIndex,
        messages,
        multiInputValues
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }
  }, [data, currentStepIndex, messages, multiInputValues, storageKey, isComplete]);

  const startFlow = async () => {
    await addBotMessage(`Olá, ${patientName}! 😊`);
    processNextStep(0);
  };

  const processNextStep = async (index: number) => {
    if (index >= flow.length) {
      setIsComplete(true);
      return;
    }

    const step = flow[index];

    // Verificar showIf
    if (step.showIf && !evaluateCondition(step.showIf, data)) {
      processNextStep(index + 1);
      return;
    }

    setStepMessagesDone(false);
    setCurrentStepIndex(index);
    setIsProcessing(false); // Liberar input quando o novo step estiver pronto
    setMultiInputValues({});

    const imageFirst = step.imagePosition === 'above';

    if (step.imageUrl && imageFirst) {
      await addBotMessage('', step.imageUrl);
    }
    if (step.question) {
      await addBotMessage(step.question);
    }
    if (step.messages) {
      for (const msg of step.messages) {
        await addBotMessage(msg);
      }
    }
    if (step.imageUrl && !imageFirst) {
      await addBotMessage('', step.imageUrl);
    }

    setStepMessagesDone(true);

    // Se é apenas mensagem, avançar automaticamente
    if (step.type === 'message') {
      // Último step (finalização)
      if (index === flow.length - 1) {
        setIsComplete(true);
        return;
      }
      processNextStep(index + 1);
    }

    scrollToBottom();
    setTimeout(() => inputRef.current?.focus(), 500);
  };

  const handleAnswer = async (answer: string) => {
    if (!answer.trim() && flow[currentStepIndex]?.required) return;

    const step = flow[currentStepIndex];
    if (!step) return;

    setIsProcessing(true); // Bloquear input imediatamente

    // Registrar resposta do usuário
    addUserMessage(answer);

    // Salvar dado
    const newData = { ...data };
    if (step.field) {
      newData[step.field] = answer;
      setData(newData);
    }

    setInputValue('');

    // Processar mensagens condicionais
    if (step.conditionalMessages) {
      for (const cm of step.conditionalMessages) {
        if (evaluateCondition(cm.condition, newData)) {
          for (const msg of cm.messages) {
            await addBotMessage(msg);
          }
          break; // Apenas a primeira condição que match
        }
      }
    }

    // Próximo step
    processNextStep(currentStepIndex + 1);
  };

  const handlePhotoUpload = (files: FileList | null) => {
    if (!files) return;
    const newPhotos = [...photos];
    const newPreviews = [...photoPreviews];
    for (let i = 0; i < files.length && newPhotos.length < 4; i++) {
      newPhotos.push(files[i]);
      newPreviews.push(URL.createObjectURL(files[i]));
    }
    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhotoSubmit = async () => {
    setIsProcessing(true);
    if (photos.length > 0) {
      addUserMessage(`📸 ${photos.length} foto${photos.length > 1 ? 's' : ''} enviada${photos.length > 1 ? 's' : ''}`);
    } else {
      addUserMessage('Sem fotos desta vez');
    }
    processNextStep(currentStepIndex + 1);
  };

  const handleComplete = async () => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    await onComplete(data, photos);
  };

  const currentStep = currentStepIndex >= 0 ? flow[currentStepIndex] : null;

  return (
    <div className="flex flex-col min-h-full">
      {/* Chat Messages */}
      <div className="flex-1 px-4 py-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
          >
            <div
              className={`max-w-[85%] relative px-5 py-3.5 text-sm leading-relaxed shadow-md backdrop-blur-sm ${msg.type === 'user'
                ? 'rounded-2xl rounded-tr-sm'
                : 'rounded-2xl rounded-tl-sm'
                }`}
              style={msg.type === 'user'
                ? {
                  background: theme.user_bubble_bg || 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: theme.user_bubble_text || '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }
                : {
                  background: theme.bot_bubble_bg || 'rgba(255, 255, 255, 0.1)',
                  color: theme.bot_bubble_text || '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }
              }
            >
              {msg.imageUrl && (
                <div
                  className="mb-3 rounded-xl overflow-hidden max-w-full border border-white/10 shadow-sm cursor-zoom-in hover:opacity-95 transition-opacity"
                  onClick={() => setEnlargedImage(msg.imageUrl!)}
                >
                  <img src={msg.imageUrl} alt="Apoio" className="max-h-60 w-full object-cover" />
                </div>
              )}
              {msg.content ? <div className="tracking-wide font-normal text-[15px]">{renderFormattedText(msg.content)}</div> : null}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-700/30 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-400/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-400/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-blue-400/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Input Area (Inline) */}
        {!isComplete && !isTyping && !isProcessing && stepMessagesDone && currentStep && ['text', 'number', 'choice', 'file', 'multi-input'].includes(currentStep.type) && (
          <div className="w-full max-w-2xl mx-auto mt-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="bg-transparent">
              {/* Choice Input */}
              {currentStep.type === 'choice' && currentStep.options && (
                <div className="flex flex-wrap gap-2 mb-2 justify-end">
                  {currentStep.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className="px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 border shadow-sm text-white"
                      style={{
                        background: theme.option_bg || 'rgba(59, 130, 246, 0.2)',
                        borderColor: theme.option_border || 'rgba(59, 130, 246, 0.4)'
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Multi Input (Cintura/Quadril) */}
              {currentStep.type === 'multi-input' && currentStep.inputs && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    {currentStep.inputs.map((input) => (
                      <div key={input.field} className="relative flex items-center bg-[#1A1D26] rounded-2xl border border-slate-800 shadow-lg focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                        <Input
                          type="number"
                          step="0.1"
                          inputMode="decimal"
                          value={multiInputValues[input.field] || ''}
                          onChange={(e) => setMultiInputValues(prev => ({ ...prev, [input.field]: e.target.value }))}
                          placeholder={input.label}
                          className="w-full bg-transparent border-0 text-slate-200 placeholder:text-slate-500 h-14 px-4 text-base focus-visible:ring-0 focus-visible:ring-offset-0 rounded-2xl text-center"
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => {
                      const allFilled = currentStep.inputs?.every(i => multiInputValues[i.field]?.trim());
                      if (!allFilled) return;

                      // Format for display and saving
                      // Save as a combined string in 'medida' field for backward compatibility
                      // Also save individual fields if backend supports them
                      const cintura = multiInputValues['cintura'];
                      const quadril = multiInputValues['quadril'];
                      const combined = `Cintura: ${cintura}cm / Quadril: ${quadril}cm`;

                      addUserMessage(combined);

                      const newData = {
                        ...data,
                        ...multiInputValues,
                        medida: combined // Force mapping to existing 'medida' field
                      };
                      setData(newData);

                      setMultiInputValues({});
                      setIsProcessing(true);
                      processNextStep(currentStepIndex + 1);
                    }}
                    disabled={!currentStep.inputs.every(i => multiInputValues[i.field]?.trim())}
                    className="self-end w-full sm:w-auto px-8 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{ background: theme.button_bg, color: theme.button_text }}
                  >
                    Enviar Medidas
                  </Button>
                </div>
              )}

              {/* Text / Number Input */}
              {!['multi-input'].includes(currentStep.type) && (currentStep.type === 'text' || currentStep.type === 'number') && (
                <div className="relative flex items-center w-full bg-[#1A1D26] rounded-full border border-slate-800 shadow-2xl ring-1 ring-white/5">
                  <Input
                    ref={inputRef}
                    type={currentStep.type === 'number' ? 'number' : 'text'}
                    inputMode={currentStep.type === 'number' ? 'decimal' : 'text'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && inputValue.trim()) {
                        handleAnswer(inputValue);
                      }
                    }}
                    placeholder={currentStep.placeholder || 'Escreva sua resposta...'}
                    className="flex-1 bg-transparent border-0 text-slate-200 placeholder:text-slate-500 h-14 pl-6 pr-14 text-base focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full"
                  />
                  <Button
                    onClick={() => inputValue.trim() && handleAnswer(inputValue)}
                    disabled={!inputValue.trim() && currentStep.required}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center p-0"
                    style={{ background: theme.button_bg, color: theme.button_text }}
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </Button>
                </div>
              )}

              {/* File Upload */}
              {currentStep.type === 'file' && (
                <div className="space-y-3 p-1">
                  {/* Preview das fotos */}
                  {photoPreviews.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      {photoPreviews.map((preview, i) => (
                        <div key={preview} className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-600/50 shadow-md group">
                          <img src={preview} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm rounded-full p-1 text-white hover:bg-red-500/90 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 items-center">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photos.length >= 4}
                      className="flex-1 bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-2xl h-12 transition-all duration-300"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      {photos.length >= 4 ? 'Limite atingido' : `Adicionar Foto (${photos.length}/4)`}
                    </Button>
                    <Button
                      onClick={handlePhotoSubmit}
                      className="w-12 h-12 rounded-full p-0 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <Send className="w-5 h-5 ml-0.5" />
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.heic,.heif"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e.target.files)}
                  />
                  <button
                    onClick={handlePhotoSubmit}
                    className="w-full text-slate-500 text-xs py-1 hover:text-slate-300 transition-colors"
                  >
                    Pular envio de fotos
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={chatEndRef} className="h-4" />
      </div>

      {/* Image Zoom Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={enlargedImage}
              alt="Zoom"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}


      {/* Botão de finalizar */}
      {isComplete && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 flex justify-center bg-gradient-to-t from-slate-950/80 to-transparent">
          <div className="w-full max-w-2xl">
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white rounded-xl h-14 text-lg font-bold shadow-lg shadow-emerald-500/20 mb-4 animate-in slide-in-from-bottom-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6 mr-2" />
                  Finalizar Check-in
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
