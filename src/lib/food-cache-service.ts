/**
 * Serviço de cache para alimentos favoritos e buscas recentes
 */

interface CachedFood {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  category?: string;
  cached_at: number;
}

interface SearchCache {
  term: string;
  results: CachedFood[];
  cached_at: number;
}

class FoodCacheService {
  private static readonly CACHE_PREFIX = 'food_cache_';
  private static readonly SEARCH_CACHE_PREFIX = 'search_cache_';
  private static readonly FAVORITES_CACHE_KEY = 'food_favorites_cache';
  private static readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas
  private static readonly SEARCH_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hora

  /**
   * Salva alimentos no cache
   */
  static cacheFoods(foods: CachedFood[]): void {
    try {
      const cached = {
        foods,
        cached_at: Date.now(),
      };
      localStorage.setItem(this.CACHE_PREFIX + 'all', JSON.stringify(cached));
    } catch (error) {
      console.warn('Erro ao salvar cache de alimentos:', error);
    }
  }

  /**
   * Recupera alimentos do cache
   */
  static getCachedFoods(): CachedFood[] | null {
    try {
      const cached = localStorage.getItem(this.CACHE_PREFIX + 'all');
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.cached_at;

      if (age > this.CACHE_EXPIRY) {
        localStorage.removeItem(this.CACHE_PREFIX + 'all');
        return null;
      }

      return parsed.foods;
    } catch (error) {
      console.warn('Erro ao recuperar cache de alimentos:', error);
      return null;
    }
  }

  /**
   * Salva resultado de busca no cache
   */
  static cacheSearch(term: string, results: CachedFood[]): void {
    try {
      const cacheKey = this.SEARCH_CACHE_PREFIX + term.toLowerCase();
      const cached = {
        term,
        results,
        cached_at: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cached));
    } catch (error) {
      console.warn('Erro ao salvar cache de busca:', error);
    }
  }

  /**
   * Recupera resultado de busca do cache
   */
  static getCachedSearch(term: string): CachedFood[] | null {
    try {
      const cacheKey = this.SEARCH_CACHE_PREFIX + term.toLowerCase();
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const parsed: SearchCache = JSON.parse(cached);
      const age = Date.now() - parsed.cached_at;

      if (age > this.SEARCH_CACHE_EXPIRY) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsed.results;
    } catch (error) {
      console.warn('Erro ao recuperar cache de busca:', error);
      return null;
    }
  }

  /**
   * Salva alimentos favoritos no cache
   */
  static cacheFavorites(foods: CachedFood[]): void {
    try {
      const cached = {
        foods,
        cached_at: Date.now(),
      };
      localStorage.setItem(this.FAVORITES_CACHE_KEY, JSON.stringify(cached));
    } catch (error) {
      console.warn('Erro ao salvar cache de favoritos:', error);
    }
  }

  /**
   * Recupera alimentos favoritos do cache
   */
  static getCachedFavorites(): CachedFood[] | null {
    try {
      const cached = localStorage.getItem(this.FAVORITES_CACHE_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.cached_at;

      if (age > this.CACHE_EXPIRY) {
        localStorage.removeItem(this.FAVORITES_CACHE_KEY);
        return null;
      }

      return parsed.foods;
    } catch (error) {
      console.warn('Erro ao recuperar cache de favoritos:', error);
      return null;
    }
  }

  /**
   * Limpa todo o cache
   */
  static clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX) || 
            key.startsWith(this.SEARCH_CACHE_PREFIX) ||
            key === this.FAVORITES_CACHE_KEY) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }

  /**
   * Limpa cache expirado
   */
  static cleanExpiredCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX) || 
            key.startsWith(this.SEARCH_CACHE_PREFIX) ||
            key === this.FAVORITES_CACHE_KEY) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const parsed = JSON.parse(cached);
              const age = Date.now() - parsed.cached_at;
              const expiry = key.startsWith(this.SEARCH_CACHE_PREFIX) 
                ? this.SEARCH_CACHE_EXPIRY 
                : this.CACHE_EXPIRY;
              
              if (age > expiry) {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            // Ignorar erros de parse
          }
        }
      });
    } catch (error) {
      console.warn('Erro ao limpar cache expirado:', error);
    }
  }
}

export default FoodCacheService;

