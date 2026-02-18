
try {
    await Deno.remove(".env.local");
} catch (e) {
    // Ignore if file doesn't exist
}

const content = `# Kiwify Configuration - URLs de Checkout
VITE_KIWIFY_CHECKOUT_BASIC=https://pay.kiwify.com.br/46MiJGu
VITE_KIWIFY_CHECKOUT_SILVER=https://pay.kiwify.com.br/zjREgXM
VITE_KIWIFY_CHECKOUT_BLACK=https://pay.kiwify.com.br/K8Ykpu5

# Kiwify Configuration - Credenciais para Webhooks
VITE_KIWIFY_CLIENT_ID=25c35e55-4929-4948-a040-e3f84cecbbfc
VITE_KIWIFY_CLIENT_SECRET=844242ec3447e0b43ae5de6cb0c2ae9f91444f33c938de1d08bb18698637ae46
VITE_KIWIFY_ACCOUNT_ID=6Brjl5ktTiUoD9s

# Anthropic API Key para geracao de feedbacks
VITE_ANTHROPIC_API_KEY=your_api_key_here
`;

const encoder = new TextEncoder();
const data = encoder.encode(content);
await Deno.writeFile(".env.local", data);
console.log("File re-created successfully");
