import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startVersionChecker, forceUpdate } from '@/lib/version-checker';

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const cleanup = startVersionChecker(() => {
      setShowUpdate(true);
    });

    return cleanup;
  }, []);

  const handleUpdate = () => {
    setUpdating(true);
    forceUpdate();
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Nova versão disponível!</h4>
            <p className="text-xs text-blue-100 mt-1">
              Atualize para ter acesso às últimas melhorias e correções.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleUpdate}
                disabled={updating}
                className="bg-white text-blue-600 hover:bg-blue-50 text-xs h-7"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar agora'
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowUpdate(false)}
                className="text-white hover:bg-white/20 text-xs h-7"
              >
                Depois
              </Button>
            </div>
          </div>
          <button
            onClick={() => setShowUpdate(false)}
            className="text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
