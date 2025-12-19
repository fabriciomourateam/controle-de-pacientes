# Teste do Relatório de Evolução - Versão Simples

## Mudanças Feitas

1. **Simplificação da captura:**
   - Removidas configurações complexas do html2canvas
   - Captura o portal inteiro sem ocultar elementos (para debug)
   - Logs detalhados no console para identificar problemas

2. **Botões disponíveis:**
   - "Baixar Evolução PNG" - Captura como imagem
   - "Baixar Evolução PDF" - Converte para PDF

3. **Frase motivacional incluída:**
   - A frase motivacional agora aparece no relatório

## Como Testar

### 1. Teste Básico
1. Acesse o portal do paciente
2. Abra o console do navegador (F12)
3. Clique no menu (três pontos) no canto superior direito
4. Clique em "Baixar Evolução PNG"
5. Observe os logs no console:
   ```
   🚀 Iniciando captura de imagem...
   🔍 Verificando gráficos...
   📊 Encontrados X gráficos
   Canvas 0: 400x300
   📸 Capturando portal...
   ✅ Canvas gerado: 1200x800
   ```

### 2. Se der erro
- Verifique se há mensagens de erro no console
- Tente aguardar mais tempo antes de clicar
- Verifique se a página carregou completamente

### 3. Verificar o arquivo baixado
- O arquivo deve conter todo o conteúdo visível do portal
- Nome do arquivo: `evolucao-nome-paciente-2024-12-18.png`

## Próximos Passos

Se a captura básica funcionar:
1. ✅ Adicionar filtros para ocultar botões
2. ✅ Melhorar qualidade da imagem
3. ✅ Customizar conteúdo incluído

Se ainda der erro:
1. 🔍 Verificar logs específicos do erro
2. 🔧 Ajustar configurações do html2canvas
3. 🎯 Testar com diferentes navegadores

## Configurações Atuais

```typescript
const canvas = await html2canvas(portalRef.current, {
  scale: 1,                    // Qualidade básica
  useCORS: true,              // Permitir imagens externas
  logging: true,              // Logs detalhados
  backgroundColor: '#0f172a', // Fundo escuro
  allowTaint: true,           // Permitir elementos "tainted"
  foreignObjectRendering: false, // Desabilitar SVG complexo
  removeContainer: true       // Limpar após captura
});
```

## Troubleshooting

**Erro de Canvas 0x0:**
- Aguardar mais tempo para gráficos carregarem
- Verificar se elementos estão visíveis na tela

**Imagem em branco:**
- Verificar permissões CORS
- Testar sem imagens externas

**Erro de memória:**
- Reduzir scale para 0.5
- Capturar em partes menores