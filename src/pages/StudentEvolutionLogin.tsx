import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { Loader2, TrendingUp, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const supabaseServiceRole = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

export default function StudentEvolutionLogin() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [telefone, setTelefone] = useState('');
    const [loading, setLoading] = useState(false);

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        const normalized = numbers.startsWith('55') && numbers.length > 11
            ? numbers.slice(2, 13)
            : numbers;
        const limited = normalized.slice(0, 11);

        if (limited.length <= 2) return limited;
        if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
        return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTelefone(formatPhone(e.target.value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanPhone = telefone.replace(/\D/g, '');

        if (cleanPhone.length < 10) {
            toast({
                title: 'Telefone inválido',
                description: 'Digite um número de telefone válido (DDD + número)',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            // Buscar paciente usando service role (sem RLS)
            const variants = [cleanPhone];
            if (cleanPhone.length === 11) {
                variants.push(`(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`);
                variants.push(`55${cleanPhone}`);
            }

            let found = false;
            let patientPhone = cleanPhone;
            let patientName = 'aluno';

            for (const variant of variants) {
                const { data, error } = await supabaseServiceRole
                    .from('patients')
                    .select('telefone, nome')
                    .eq('telefone', variant)
                    .maybeSingle();

                if (!error && data) {
                    found = true;
                    patientPhone = data.telefone;
                    patientName = data.nome || 'aluno';
                    break;
                }
            }

            if (!found) {
                toast({
                    title: 'Paciente não encontrado',
                    description: 'Não encontramos um cadastro com este telefone. Verifique o número e tente novamente.',
                    variant: 'destructive'
                });
                return;
            }

            toast({
                title: 'Acesso liberado! 🎉',
                description: `Bem-vindo(a), ${patientName}!`
            });
            navigate(`/evolucao-aluno/${encodeURIComponent(patientPhone)}`);
        } catch (error) {
            console.error('Erro ao buscar paciente:', error);
            toast({
                title: 'Erro',
                description: 'Ocorreu um erro ao buscar seus dados. Tente novamente.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="bg-slate-800/60 backdrop-blur-sm border-slate-700/50 shadow-2xl">
                    <CardHeader className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold text-white">
                                Evolução do Aluno
                            </CardTitle>
                            <CardDescription className="text-slate-400 mt-2">
                                Acompanhe seu progresso e resultados
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="telefone" className="text-slate-300 flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Número de Telefone
                                </Label>
                                <Input
                                    id="telefone"
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    value={telefone}
                                    onChange={handlePhoneChange}
                                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-12 text-lg"
                                    disabled={loading}
                                    autoFocus
                                />
                                <p className="text-xs text-slate-400">
                                    Digite o telefone cadastrado pelo seu treinador
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || telefone.length < 14}
                                className="w-full h-12 text-lg bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Buscando...
                                    </>
                                ) : (
                                    'Ver Minha Evolução'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-700/50">
                            <p className="text-center text-sm text-slate-400">
                                📊 Acompanhe peso, medidas, composição corporal e fotos
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-slate-500 mt-6">
                    Problemas para acessar? Entre em contato com seu treinador
                </p>
            </motion.div>
        </div>
    );
}
