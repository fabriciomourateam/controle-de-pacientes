# Suporte para Fotos em Formato HEIC

## Visão Geral

O sistema agora suporta automaticamente fotos em formato HEIC (High Efficiency Image Container), que é o formato padrão usado pelo iPhone para fotos.

## Como Funciona

### Conversão Automática e Transparente

Quando um usuário faz upload de uma foto HEIC, o sistema:

1. **Detecta automaticamente** se o arquivo é HEIC (por extensão `.heic`, `.heif` ou tipo MIME)
2. **Converte para JPEG** usando a biblioteca `heic2any` com qualidade de 90%
3. **Faz upload do JPEG** para o Supabase Storage
4. **Mantém compatibilidade total** - o resto do sistema continua trabalhando com JPEG como sempre

### Nenhuma Mudança na Leitura de Fotos

✅ **IMPORTANTE**: Nenhuma alteração foi feita no sistema de leitura de fotos existente. Todas as fotos continuam sendo armazenadas e lidas como JPEG.

## Componentes Atualizados

Os seguintes componentes agora suportam conversão automática de HEIC:

### 1. Dados Iniciais do Paciente
- **Arquivo**: `src/components/evolution/InitialDataInput.tsx`
- **Uso**: Upload de fotos iniciais (frente, lado, lado 2, costas)

### 2. Dados Atuais do Paciente
- **Arquivo**: `src/components/evolution/CurrentDataInput.tsx`
- **Uso**: Upload de fotos atuais do paciente

### 3. Adicionar Fotos a Check-in Existente
- **Arquivo**: `src/components/evolution/AddPhotosToCheckin.tsx`
- **Uso**: Adicionar fotos a um check-in já criado

### 4. Adicionar Fotos de Check-in
- **Arquivo**: `src/components/evolution/AddCheckinPhotos.tsx`
- **Uso**: Upload de fotos durante criação de check-in

### 5. Adicionar Dados de Evolução
- **Arquivo**: `src/components/evolution/AddEvolutionData.tsx`
- **Uso**: Upload de fotos com dados de evolução

### 6. Modal de Comparação de Fotos
- **Arquivo**: `src/components/checkins/PhotoComparisonModal.tsx`
- **Uso**: Upload de fotos para comparação (inicial, anterior, atual)

## Biblioteca Utilizada

### heic2any

- **Versão**: Instalada via npm
- **Documentação**: https://github.com/alexcorvi/heic2any
- **Funcionalidade**: Converte HEIC/HEIF para JPEG no navegador
- **Suporte**: Funciona em todos os navegadores modernos

## API de Conversão

### Arquivo: `src/lib/heic-converter.ts`

#### Funções Principais

##### `processPhotoFile(file: File, quality?: number): Promise<File>`

Função principal que deve ser usada antes de fazer upload.

```typescript
import { processPhotoFile } from '@/lib/heic-converter';

// Antes do upload
const processedFile = await processPhotoFile(originalFile);
// Agora pode fazer upload do processedFile normalmente
await uploadToSupabase(processedFile);
```

**Parâmetros:**
- `file`: Arquivo original selecionado pelo usuário
- `quality`: Qualidade da conversão JPEG (0-1), padrão 0.9

**Retorno:**
- Se for HEIC: retorna arquivo JPEG convertido
- Se não for HEIC: retorna o arquivo original sem modificações

##### `isHeicFile(file: File): boolean`

Verifica se um arquivo é do tipo HEIC.

```typescript
if (isHeicFile(file)) {
  console.log('Este arquivo será convertido automaticamente');
}
```

##### `convertHeicToJpeg(heicFile: File, quality?: number): Promise<File>`

Converte um arquivo HEIC para JPEG (uso interno).

##### `processMultiplePhotoFiles(files: File[], quality?: number): Promise<File[]>`

Processa múltiplos arquivos de uma vez.

## Logs de Console

Durante a conversão, o sistema exibe logs informativos:

```
🔄 Convertendo HEIC para JPEG: foto.heic
✅ Conversão concluída: {
  original: "foto.heic (2.5 MB)",
  converted: "foto.jpg (1.8 MB)"
}
```

## Tratamento de Erros

Se a conversão falhar, o sistema:

1. Exibe erro no console: `❌ Erro ao converter HEIC`
2. Lança exceção com mensagem amigável
3. Permite que o componente trate o erro (geralmente mostra toast ao usuário)

## Formatos Suportados

### Entrada (Conversão Automática)
- `.heic` - High Efficiency Image Container
- `.heif` - High Efficiency Image Format
- MIME types: `image/heic`, `image/heif`

### Saída (Após Conversão)
- `.jpg` / `.jpeg` - JPEG com qualidade 90%

### Outros Formatos (Sem Conversão)
- `.jpg`, `.jpeg` - Passam direto sem conversão
- `.png` - Passam direto sem conversão
- `.webp` - Passam direto sem conversão

## Qualidade da Conversão

- **Padrão**: 90% (0.9)
- **Ajustável**: Pode ser alterado passando parâmetro `quality` para `processPhotoFile()`
- **Recomendação**: 90% oferece excelente qualidade visual com tamanho de arquivo reduzido

## Compatibilidade

### Navegadores Suportados
- ✅ Chrome/Edge (versões recentes)
- ✅ Firefox (versões recentes)
- ✅ Safari (versões recentes)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Dispositivos
- ✅ iPhone (iOS 11+) - Formato nativo
- ✅ Android
- ✅ Desktop (Windows, macOS, Linux)

## Performance

### Tempo de Conversão
- Arquivo pequeno (< 2 MB): ~500ms
- Arquivo médio (2-5 MB): ~1-2s
- Arquivo grande (> 5 MB): ~2-4s

### Tamanho de Arquivo
- HEIC geralmente é 40-50% menor que JPEG
- Após conversão para JPEG 90%, tamanho aumenta mas mantém qualidade visual

## Testes

### Como Testar

1. **Obter foto HEIC**:
   - Tirar foto com iPhone (formato padrão)
   - Ou baixar exemplo de: https://github.com/nokiatech/heif/tree/gh-pages/content/images

2. **Fazer upload**:
   - Ir para qualquer tela de upload de fotos
   - Selecionar arquivo HEIC
   - Verificar logs no console
   - Confirmar que foto aparece normalmente após upload

3. **Verificar conversão**:
   - Abrir DevTools > Console
   - Procurar por mensagens "🔄 Convertendo HEIC" e "✅ Conversão concluída"

## Troubleshooting

### Problema: "Falha ao converter imagem HEIC"

**Possíveis causas:**
- Arquivo corrompido
- Navegador muito antigo
- Memória insuficiente para arquivo muito grande

**Solução:**
- Pedir ao usuário para tentar com outro formato (JPEG, PNG)
- Verificar se navegador está atualizado
- Reduzir tamanho da foto antes do upload

### Problema: Conversão muito lenta

**Possíveis causas:**
- Arquivo muito grande (> 10 MB)
- Dispositivo com pouco poder de processamento

**Solução:**
- Adicionar indicador de loading durante conversão
- Sugerir ao usuário reduzir resolução da foto

## Manutenção

### Atualizar Biblioteca

```bash
npm update heic2any
```

### Ajustar Qualidade Padrão

Editar `src/lib/heic-converter.ts`:

```typescript
export async function processPhotoFile(
  file: File,
  quality: number = 0.85  // Alterar aqui (0.85 = 85%)
): Promise<File> {
  // ...
}
```

## Conclusão

O suporte a HEIC foi implementado de forma **transparente e não-invasiva**:

- ✅ Nenhuma mudança no sistema de leitura de fotos
- ✅ Conversão automática e invisível para o usuário
- ✅ Compatibilidade total com sistema existente
- ✅ Logs informativos para debugging
- ✅ Tratamento de erros robusto

Os usuários podem agora fazer upload de fotos HEIC diretamente do iPhone sem precisar converter manualmente!
