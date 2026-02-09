import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Upload, X, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { FlowStep } from '@/lib/checkin-flow-default';
import { CheckinFlowTheme, DEFAULT_THEME } from '@/lib/checkin-flow-service';

interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  isTyping?: boolean;
}

interface ChatCheckinEngineProps {
  flow: FlowStep[];
  patientName: string;
  onComplete: (data: Record<string, string>, photos: File[]) => Promise<void>;
  loading: boolean;
  theme?: CheckinFlowTheme;
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

export function ChatCheckinEngine({ flow, patientName, onComplete, loading, theme: customTheme }: ChatCheckinEngineProps) {
  const theme = { ...DEFAULT_THEME, ...customTheme };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [data, setData] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const addBotMessage = (content: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsTyping(true);
      scrollToBottom();
      const delay = Math.min(content.length * 15, 1500);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { id: `bot-${Date.now()}-${Math.random()}`, type: 'bot', content }]);
        scrollToBottom();
        setTimeout(resolve, 300);
      }, delay);
    });
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, type: 'user', content }]);
    scrollToBottom();
  };

  // Iniciar o fluxo
  useEffect(() => {
    startFlow();
  }, []);

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

    setCurrentStepIndex(index);

    // Exibir mensagens do step
    if (step.question) {
      await addBotMessage(step.question);
    }
    if (step.messages) {
      for (const msg of step.messages) {
        await addBotMessage(msg);
      }
    }

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
    if (photos.length > 0) {
      addUserMessage(`📸 ${photos.length} foto${photos.length > 1 ? 's' : ''} enviada${photos.length > 1 ? 's' : ''}`);
    } else {
      addUserMessage('Sem fotos desta vez');
    }
    processNextStep(currentStepIndex + 1);
  };

  const handleComplete = async () => {
    await onComplete(data, photos);
  };

  const currentStep = currentStepIndex >= 0 ? flow[currentStepIndex] : null;

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.type === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
              }`}
              style={msg.type === 'user' 
                ? { background: theme.user_bubble_bg, color: theme.user_bubble_text }
                : { background: theme.bot_bubble_bg, color: theme.bot_bubble_text, border: '1px solid rgba(255,255,255,0.05)' }
              }
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800/80 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-700/50">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      {!isComplete && !isTyping && currentStep && (
        <div className="border-t border-slate-800/50 p-4 bg-slate-950/50">
          {/* Choice Input */}
          {currentStep.type === 'choice' && currentStep.options && (
            <div className="flex flex-wrap gap-2">
              {currentStep.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="px-4 py-2.5 rounded-xl text-sm transition-all duration-200 hover:opacity-80 border"
                  style={{ background: theme.option_bg, color: theme.option_text, borderColor: theme.option_border }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Text / Number Input */}
          {(currentStep.type === 'text' || currentStep.type === 'number') && (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type={currentStep.type === 'number' ? 'number' : 'text'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputValue.trim()) {
                    handleAnswer(inputValue);
                  }
                }}
                placeholder={currentStep.placeholder || 'Digite sua resposta...'}
                className="flex-1 bg-slate-800/50 border-slate-700/50 text-white rounded-xl h-11 focus:border-blue-500/50"
              />
              <Button
                onClick={() => inputValue.trim() && handleAnswer(inputValue)}
                disabled={!inputValue.trim() && currentStep.required}
                className="rounded-xl h-11 px-4 hover:opacity-90"
                style={{ background: theme.button_bg, color: theme.button_text }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* File Upload */}
          {currentStep.type === 'file' && (
            <div className="space-y-3">
              {/* Preview das fotos */}
              {photoPreviews.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {photoPreviews.map((preview, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700/50">
                      <img src={preview} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-red-500/80 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photos.length >= 4}
                  className="flex-1 border-slate-700/50 text-slate-300 hover:bg-slate-800/50 rounded-xl h-11"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {photos.length >= 4 ? 'Máximo 4 fotos' : `Adicionar Foto (${photos.length}/4)`}
                </Button>
                <Button
                  onClick={handlePhotoSubmit}
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl h-11 px-4"
                >
                  <Send className="w-4 h-4" />
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
                className="text-slate-500 text-xs hover:text-slate-300 transition-colors"
              >
                Pular fotos por enquanto →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Botão de finalizar */}
      {isComplete && (
        <div className="border-t border-slate-800/50 p-4 bg-slate-950/50">
          <Button
            onClick={handleComplete}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white rounded-xl h-12 text-base shadow-lg shadow-emerald-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Enviando check-in...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Finalizar e Enviar Check-in
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
