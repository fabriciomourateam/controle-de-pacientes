import { next } from '@vercel/edge';

// OG meta tags dinâmicos por rota
// WhatsApp/Telegram/Twitter crawlers não executam JS, então precisamos
// injetar as meta tags corretas no HTML antes de servir a resposta.
const OG_CONFIGS: Record<string, { title: string; description: string; image: string }> = {
    '/anamnese/': {
        title: 'Formulário de Anamnese',
        description: 'Preencha sua anamnese para que eu possa elaborar todo seu planejamento personalizado.',
        image: '/og-myshape.png',
    },
    '/checkin/': {
        title: 'Check-in de Avaliação',
        description: 'Registre seu progresso para acompanharmos sua evolução.',
        image: '/og-myshape.png',
    },
};

export const config = {
    matcher: ['/anamnese/:path*', '/checkin/:path*'],
};

export default async function middleware(request: Request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Encontrar config OG baseado no path
    const matchedKey = Object.keys(OG_CONFIGS).find(key => pathname.startsWith(key));
    if (!matchedKey) return next();

    const ogConfig = OG_CONFIGS[matchedKey];
    const absoluteImageUrl = `${url.origin}${ogConfig.image}`;

    // Buscar resposta original (index.html via rewrite)
    const response = await next();
    const contentType = response.headers.get('content-type') || '';

    // Só modificar HTML
    if (!contentType.includes('text/html')) return response;

    const html = await response.text();

    // Substituir meta tags OG no HTML
    let modifiedHtml = html
        // og:title
        .replace(
            /<meta property="og:title" content="[^"]*"\s*\/?>/,
            `<meta property="og:title" content="${ogConfig.title}" />`
        )
        // og:description
        .replace(
            /<meta property="og:description"\s*content="[^"]*"\s*\/?>/,
            `<meta property="og:description" content="${ogConfig.description}" />`
        )
        // og:image
        .replace(
            /<meta property="og:image" content="[^"]*"\s*\/?>/,
            `<meta property="og:image" content="${absoluteImageUrl}" />`
        )
        // twitter:title
        .replace(
            /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
            `<meta name="twitter:title" content="${ogConfig.title}" />`
        )
        // twitter:description
        .replace(
            /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
            `<meta name="twitter:description" content="${ogConfig.description}" />`
        )
        // twitter:image
        .replace(
            /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
            `<meta name="twitter:image" content="${absoluteImageUrl}" />`
        )
        // title tag
        .replace(
            /<title>[^<]*<\/title>/,
            `<title>${ogConfig.title}</title>`
        );

    return new Response(modifiedHtml, {
        status: response.status,
        headers: response.headers,
    });
}
