import html2canvas from 'html2canvas';

interface PNGGenerationOptions {
  patientName: string;
  filename?: string;
  quality?: number;
  scale?: number;
}

export class RenewalPNGGenerator {
  private static async waitForImages(element: HTMLElement): Promise<void> {
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Continue even if image fails
        
        // Timeout after 10 seconds
        setTimeout(() => resolve(), 10000);
      });
    });
    
    await Promise.all(imagePromises);
  }

  private static async captureElement(element: HTMLElement, options: {
    scale?: number;
  } = {}): Promise<HTMLCanvasElement> {
    const { scale = 2 } = options;
    
    // Wait for all images to load
    await this.waitForImages(element);
    
    // Small delay to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get the actual content width (without margins)
    const computedStyle = window.getComputedStyle(element);
    const contentWidth = element.offsetWidth - parseFloat(computedStyle.paddingLeft) - parseFloat(computedStyle.paddingRight);
    
    return html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0f172a', // slate-900 background
      width: contentWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: contentWidth,
      windowHeight: element.scrollHeight,
      ignoreElements: (element) => {
        // Ignore elements that shouldn't be in PNG
        return element.hasAttribute('data-png-hide') || 
               element.classList.contains('sidebar') ||
               element.tagName === 'NAV' ||
               element.tagName === 'HEADER';
      },
      onclone: (clonedDoc) => {
        // Ensure all styles are applied to the cloned document
        const clonedElement = clonedDoc.querySelector('[data-pdf-content]') as HTMLElement;
        if (clonedElement) {
          // Force visibility and positioning
          clonedElement.style.position = 'relative';
          clonedElement.style.left = '0';
          clonedElement.style.top = '0';
          clonedElement.style.transform = 'none';
          clonedElement.style.margin = '0';
          clonedElement.style.padding = '20px';
          clonedElement.style.maxWidth = `${contentWidth}px`;
          clonedElement.style.width = `${contentWidth}px`;
          clonedElement.style.boxSizing = 'border-box';
          
          // Ensure all child elements are visible and properly sized
          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style) {
              htmlEl.style.opacity = '1';
              htmlEl.style.visibility = 'visible';
            }
          });
        }
      }
    });
  }

  static async generatePNG(options: PNGGenerationOptions): Promise<void> {
    const { patientName, filename, quality = 0.92, scale = 1.5 } = options; // Reduzido scale e quality para performance
    
    try {
      // Find the main content element
      const contentElement = document.querySelector('[data-pdf-content]') as HTMLElement;
      if (!contentElement) {
        throw new Error('Elemento de conteúdo não encontrado. Certifique-se de que o elemento tenha o atributo data-pdf-content.');
      }

      // Show loading state
      const loadingToast = document.createElement('div');
      loadingToast.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #1e293b; color: white; padding: 16px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 20px; height: 20px; border: 2px solid #3b82f6; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span>Capturando página...</span>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loadingToast);

      // Capture the content as canvas
      console.log('📸 Capturando conteúdo da página...');
      const canvas = await this.captureElement(contentElement, { scale });
      
      // Update loading message
      loadingToast.querySelector('span')!.textContent = 'Processando imagem...';
      
      // Convert canvas to PNG blob with optimized settings
      console.log('🖼️ Convertendo para PNG...');
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png', quality);
      });
      
      // Update loading message
      loadingToast.querySelector('span')!.textContent = 'Preparando download...';
      
      // Generate filename
      const finalFilename = filename || `relatorio-evolucao-${patientName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
      
      // Create download link and trigger download
      console.log('💾 Salvando arquivo PNG...');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      // Remove loading toast
      document.body.removeChild(loadingToast);
      
      // Show success message
      const successToast = document.createElement('div');
      successToast.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #059669; color: white; padding: 16px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span>✅</span>
            <span>Imagem salva com sucesso!</span>
          </div>
        </div>
      `;
      document.body.appendChild(successToast);
      
      setTimeout(() => {
        if (document.body.contains(successToast)) {
          document.body.removeChild(successToast);
        }
      }, 3000);
      
      console.log('✅ PNG gerado com sucesso:', finalFilename);
      
    } catch (error) {
      console.error('❌ Erro ao gerar PNG:', error);
      
      // Remove loading toast if it exists
      const loadingToasts = document.querySelectorAll('[style*="Capturando página"], [style*="Processando imagem"], [style*="Preparando download"]');
      loadingToasts.forEach(toast => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      });
      
      // Show error message
      const errorToast = document.createElement('div');
      errorToast.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #dc2626; color: white; padding: 16px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span>❌</span>
            <span>Erro ao gerar imagem. Tente novamente.</span>
          </div>
        </div>
      `;
      document.body.appendChild(errorToast);
      
      setTimeout(() => {
        if (document.body.contains(errorToast)) {
          document.body.removeChild(errorToast);
        }
      }, 5000);
      
      throw error;
    }
  }

  // Method to prepare page for PNG generation
  static preparePage(): void {
    // Hide elements that shouldn't appear in PNG
    const elementsToHide = [
      '[data-png-hide]',
      '.sidebar',
      'nav',
      'header',
      '.navigation',
      '.breadcrumb'
    ];
    
    elementsToHide.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    });
    
    // Ensure content is visible and properly positioned
    const contentElement = document.querySelector('[data-pdf-content]') as HTMLElement;
    if (contentElement) {
      contentElement.style.position = 'relative';
      contentElement.style.left = '0';
      contentElement.style.top = '0';
      contentElement.style.transform = 'none';
      contentElement.style.width = '100%';
      contentElement.style.maxWidth = 'none';
    }
  }

  // Method to restore page after PNG generation
  static restorePage(): void {
    // Show hidden elements
    const elementsToShow = [
      '[data-png-hide]',
      '.sidebar',
      'nav', 
      'header',
      '.navigation',
      '.breadcrumb'
    ];
    
    elementsToShow.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
    });
  }
}

// Export utility function for easy use
export const generateRenewalPNG = async (patientName: string, options?: Partial<PNGGenerationOptions>) => {
  await RenewalPNGGenerator.generatePNG({
    patientName,
    ...options
  });
};