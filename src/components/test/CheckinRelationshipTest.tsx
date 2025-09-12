import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { testCheckinRelationship, testInsertCheckinWithExistingPhone } from '@/lib/test-checkin-relationship-clean';

export function CheckinRelationshipTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTest = async (testFunction: () => Promise<void>) => {
    setIsLoading(true);
    setTestResults([]);
    
    // Interceptar console.log para mostrar na interface
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      originalLog(...args);
      addResult(args.join(' '));
    };
    
    console.error = (...args) => {
      originalError(...args);
      addResult(`ERRO: ${args.join(' ')}`);
    };

    try {
      await testFunction();
    } catch (error) {
      addResult(`ERRO inesperado: ${error}`);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Teste de Relacionamento Checkin ↔ Patients
          <Badge variant="outline">Debug</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={() => runTest(testCheckinRelationship)}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Testando...' : 'Testar Relacionamento'}
          </Button>
          
          <Button 
            onClick={() => runTest(testInsertCheckinWithExistingPhone)}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Testando...' : 'Testar Insercao'}
          </Button>
          
          <Button 
            onClick={() => setTestResults([])}
            variant="ghost"
            size="sm"
          >
            Limpar
          </Button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h4 className="font-semibold mb-2">Resultados dos Testes:</h4>
          {testResults.length === 0 ? (
            <p className="text-muted-foreground">Clique em um botão para executar os testes</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`text-sm font-mono ${
                    result.includes('ERRO') ? 'text-red-600 dark:text-red-400' :
                    result.includes('sucesso') ? 'text-green-600 dark:text-green-400' :
                    result.includes('Testando') ? 'text-blue-600 dark:text-blue-400' :
                    'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            O que os testes verificam:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>Pacientes:</strong> Se a tabela patients tem dados</li>
            <li>• <strong>Checkins:</strong> Se a tabela checkin tem dados</li>
            <li>• <strong>JOIN Manual:</strong> Se consegue relacionar por telefone</li>
            <li>• <strong>Foreign Key:</strong> Se o relacionamento FK está configurado</li>
            <li>• <strong>Correspondência:</strong> Se há telefones em comum</li>
            <li>• <strong>Inserção:</strong> Se consegue criar checkin vinculado</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
