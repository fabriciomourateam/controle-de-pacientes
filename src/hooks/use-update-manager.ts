import { useState, useEffect } from 'react';
import { checkForUpdates, forceUpdate, isUpdatePending, subscribeToUpdates } from '@/lib/version-checker';

export function useUpdateManager() {
    const [updateAvailable, setUpdateAvailable] = useState(isUpdatePending());

    useEffect(() => {
        // Inscrever para atualizações de estado
        const unsubscribe = subscribeToUpdates((available) => {
            setUpdateAvailable(available);
        });

        // Verificar se já tem atualização pendente ao montar
        setUpdateAvailable(isUpdatePending());

        return unsubscribe;
    }, []);

    return {
        isUpdatePending: updateAvailable,
        applyUpdate: forceUpdate,
        checkForUpdates
    };
}
