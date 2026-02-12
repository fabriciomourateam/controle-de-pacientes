import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { checkinService } from '@/lib/checkin-service';
import { createClient } from '@supabase/supabase-js';
import { EvolutionCharts } from '@/components/evolution/EvolutionCharts';
import { BodyFatChart } from '@/components/evolution/BodyFatChart';
import { BodyCompositionMetrics } from '@/components/evolution/BodyCompositionMetrics';
import { GoogleDriveImage } from '@/components/ui/google-drive-image';
import { convertGoogleDriveUrl, isGoogleDriveUrl } from '@/lib/google-drive-utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Heart, Scale, TrendingUp, Camera, ZoomIn, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

const supabaseServiceRole = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const getDailyMotivationalPhrase = () => {
    const phrases = [
        'Cada refeição é um passo em direção aos seus objetivos! 💪',
        'Você está no caminho certo! Continue assim! 🌟',
        'Pequenas escolhas diárias geram grandes resultados! ✨',
        'Seu compromisso com a saúde é inspirador! 🎯',
        'Cada dia é uma nova oportunidade de cuidar de si! 🌈',
        'Você está construindo um futuro mais saudável! 🚀',
        'Consistência é a chave do sucesso! 🔑',
        'Seu esforço de hoje será sua vitória de amanhã! 🏆',
        'Acredite no processo e confie na jornada! 💚',
        'Você é mais forte do que imagina! 💪',
    ];
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return phrases[dayOfYear % phrases.length];
};

// Galeria de fotos somente-leitura (sem botões de adicionar/comparar/deletar)
function ReadOnlyPhotoGallery({ checkins, patient }: { checkins: Checkin[]; patient: Patient }) {
    const [zoomPhoto, setZoomPhoto] = useState<{ url: string; label: string } | null>(null);
    const patientAny = patient as any;

    // Coletar fotos iniciais
    type PhotoItem = { url: string; date: string; weight: string; label: string };
    const photos: PhotoItem[] = [];

    const angleLabels: Record<string, string> = { frente: 'Frente', lado: 'Lado', lado_2: 'Lado 2', costas: 'Costas' };
    (['frente', 'lado', 'lado_2', 'costas'] as const).forEach(angle => {
        const url = patientAny?.[`foto_inicial_${angle}`];
        if (url) {
            photos.push({
                url,
                date: patientAny.data_fotos_iniciais
                    ? new Date(patientAny.data_fotos_iniciais).toLocaleDateString('pt-BR')
                    : 'Inicial',
                weight: patientAny.peso_inicial?.toString() || '',
                label: `Inicial - ${angleLabels[angle]}`,
            });
        }
    });

    // Coletar fotos de checkins (do mais antigo ao mais recente)
    [...checkins].sort((a, b) => new Date(a.data_checkin).getTime() - new Date(b.data_checkin).getTime()).forEach(c => {
        [c.foto_1, c.foto_2, c.foto_3, c.foto_4].forEach((url, i) => {
            if (url) {
                photos.push({
                    url,
                    date: new Date(c.data_checkin).toLocaleDateString('pt-BR'),
                    weight: c.peso || '',
                    label: `${new Date(c.data_checkin).toLocaleDateString('pt-BR')} - ${['Frente', 'Lado', 'Lado 2', 'Costas'][i]}`,
                });
            }
        });
    });

    // Agrupar por data
    const byDate = photos.reduce((acc, p) => {
        (acc[p.date] = acc[p.date] || []).push(p);
        return acc;
    }, {} as Record<string, PhotoItem[]>);

    const sortedDates = Object.keys(byDate).sort((a, b) => {
        const parse = (d: string) => { const p = d.split('/'); return p.length === 3 ? new Date(+p[2], +p[1] - 1, +p[0]) : new Date(0); };
        return parse(b).getTime() - parse(a).getTime();
    });

    const renderPhoto = (photo: PhotoItem) => {
        const isDrive = isGoogleDriveUrl(photo.url);
        return (
            <div
                key={photo.label}
                className="relative group cursor-pointer rounded-xl overflow-hidden border border-slate-700/50 hover:border-blue-500/50 transition-all"
                onClick={() => setZoomPhoto({ url: photo.url, label: photo.label })}
            >
                <div className="aspect-[3/4] bg-slate-800">
                    {isDrive ? (
                        <GoogleDriveImage src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                    ) : (
                        <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" loading="lazy" />
                    )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <div className="flex items-center gap-1 text-white text-xs">
                        <ZoomIn className="w-3 h-3" /> Ampliar
                    </div>
                </div>
                {photo.weight && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                        {photo.weight}kg
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Camera className="w-5 h-5 text-blue-400" />
                        Evolução Fotográfica
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {sortedDates.map(date => (
                        <div key={date}>
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-300">{date}</span>
                                {byDate[date][0]?.weight && (
                                    <span className="text-xs text-slate-500">({byDate[date][0].weight}kg)</span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {byDate[date].map(renderPhoto)}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Zoom Dialog */}
            <Dialog open={!!zoomPhoto} onOpenChange={() => setZoomPhoto(null)}>
                <DialogContent className="max-w-3xl bg-slate-900 border-slate-700 p-2">
                    {zoomPhoto && (
                        <div>
                            <p className="text-slate-300 text-sm mb-2 px-2">{zoomPhoto.label}</p>
                            {isGoogleDriveUrl(zoomPhoto.url) ? (
                                <GoogleDriveImage src={zoomPhoto.url} alt={zoomPhoto.label} className="w-full max-h-[80vh] object-contain rounded-lg" />
                            ) : (
                                <img src={zoomPhoto.url} alt={zoomPhoto.label} className="w-full max-h-[80vh] object-contain rounded-lg" />
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function StudentEvolution() {
    const { telefone } = useParams<{ telefone: string }>();
    const { toast } = useToast();
    const [checkins, setCheckins] = useState<Checkin[]>([]);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [bodyCompositions, setBodyCompositions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [telefone]);

    async function loadData() {
        if (!telefone) {
            setError('Telefone não informado');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [checkinsData, patientResult, bioResult] = await Promise.all([
                checkinService.getByPhone(telefone),
                supabaseServiceRole
                    .from('patients')
                    .select('*')
                    .eq('telefone', telefone)
                    .maybeSingle(),
                (supabaseServiceRole as any)
                    .from('body_composition')
                    .select('*')
                    .eq('telefone', telefone)
                    .order('data_avaliacao', { ascending: false })
                    .limit(50),
            ]);

            if (patientResult.error || !patientResult.data) {
                throw new Error('Paciente não encontrado');
            }

            setPatient(patientResult.data);
            setCheckins(checkinsData);
            if (bioResult.data) {
                setBodyCompositions(bioResult.data);
            }
        } catch (err: any) {
            console.error('Erro ao carregar dados:', err);
            setError(err.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="max-w-4xl mx-auto p-6 space-y-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full mx-4">
                    <CardContent className="pt-6 text-center">
                        <div className="text-red-400 mb-4">
                            <Heart className="w-16 h-16 mx-auto opacity-50" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-white">
                            Ops! Algo deu errado
                        </h3>
                        <p className="text-slate-400 mb-6">
                            {error || 'Não foi possível carregar os dados'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Prepare weight data for summary cards
    const weightData: { data: string; peso: number }[] = [];
    const patientAny = patient as any;
    if (patientAny?.peso_inicial) {
        const dataInicial = patientAny.data_fotos_iniciais || patient?.created_at;
        weightData.push({
            data: new Date(dataInicial).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
            peso: parseFloat(patientAny.peso_inicial.toString()),
        });
    }
    const sortedCheckinsAsc = [...checkins].sort(
        (a, b) => new Date(a.data_checkin).getTime() - new Date(b.data_checkin).getTime()
    );
    sortedCheckinsAsc.forEach((c) => {
        if (c.peso) {
            weightData.push({
                data: new Date(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
                peso: parseFloat(c.peso.replace(',', '.')),
            });
        }
    });

    const initialWeight = weightData.length > 0 ? weightData[0].peso : null;
    const currentWeight = weightData.length > 1 ? weightData[weightData.length - 1].peso : null;
    const weightChange = initialWeight !== null && currentWeight !== null
        ? (currentWeight - initialWeight).toFixed(1)
        : null;

    const isNegative = weightChange !== null && parseFloat(weightChange) < 0;
    const isNeutral = weightChange !== null && Math.abs(parseFloat(weightChange)) < 0.1;

    // Check if there are photos in checkins
    const hasPhotos = checkins.some(c => c.foto_1 || c.foto_2 || c.foto_3 || c.foto_4) ||
        !!(patientAny?.foto_inicial_frente || patientAny?.foto_inicial_lado || patientAny?.foto_inicial_costas);

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.12),transparent_50%)]" />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
                        backgroundSize: '50px 50px',
                    }}
                />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        <h1 className="text-3xl sm:text-4xl font-bold text-white">
                            📊 Minha Evolução
                        </h1>
                        <p className="text-slate-400 mt-2">
                            {patient?.nome || 'Aluno'} — Acompanhe seu progresso
                        </p>
                    </motion.div>

                    {/* Weight Summary Cards */}
                    {weightData.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                        >
                            {/* Peso Inicial */}
                            {initialWeight !== null && (
                                <Card className="bg-gradient-to-br from-green-600/20 via-green-500/15 to-emerald-500/10 border-green-500/30">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-green-200 flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-green-500/20">
                                                <Scale className="w-4 h-4 text-green-400" />
                                            </div>
                                            Peso Inicial
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                                            {initialWeight.toFixed(1)}
                                            <span className="text-lg ml-1">kg</span>
                                        </div>
                                        <p className="text-xs text-green-300/70 mt-1">{weightData[0]?.data}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Peso Atual */}
                            {currentWeight !== null && (
                                <Card className="bg-gradient-to-br from-indigo-600/20 via-indigo-500/15 to-blue-500/10 border-indigo-500/30">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-indigo-200 flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-indigo-500/20">
                                                <Scale className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            Peso Atual
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-blue-300 bg-clip-text text-transparent">
                                            {currentWeight.toFixed(1)}
                                            <span className="text-lg ml-1">kg</span>
                                        </div>
                                        <p className="text-xs text-indigo-300/70 mt-1">{weightData[weightData.length - 1]?.data}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Variação */}
                            {weightChange !== null && (
                                <Card className={`bg-gradient-to-br transition-all duration-300 ${isNeutral
                                    ? 'from-slate-600/20 via-slate-500/15 to-gray-500/10 border-slate-500/30'
                                    : isNegative
                                        ? 'from-emerald-600/20 via-emerald-500/15 to-green-500/10 border-emerald-500/30'
                                        : 'from-orange-600/20 via-orange-500/15 to-amber-500/10 border-orange-500/30'
                                    }`}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className={`text-sm flex items-center gap-2 ${isNeutral ? 'text-slate-200' : isNegative ? 'text-emerald-200' : 'text-orange-200'
                                            }`}>
                                            <div className={`p-1.5 rounded-lg ${isNeutral ? 'bg-slate-500/20' : isNegative ? 'bg-emerald-500/20' : 'bg-orange-500/20'
                                                }`}>
                                                <TrendingUp className={`w-4 h-4 ${isNeutral ? 'text-slate-400' : isNegative ? 'text-emerald-400' : 'text-orange-400'
                                                    }`} />
                                            </div>
                                            Variação
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${isNeutral
                                            ? 'from-slate-300 to-gray-300'
                                            : isNegative
                                                ? 'from-emerald-300 to-green-300'
                                                : 'from-orange-300 to-amber-300'
                                            }`}>
                                            {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange}
                                            <span className="text-lg ml-1">kg</span>
                                        </div>
                                        <p className={`text-xs mt-1 ${isNeutral ? 'text-slate-300/70' : isNegative ? 'text-emerald-300/70' : 'text-orange-300/70'
                                            }`}>
                                            {isNeutral ? 'Sem variação' : isNegative ? 'Perda de peso' : 'Ganho de peso'}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    )}

                    {/* Body Composition */}
                    {bodyCompositions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <BodyCompositionMetrics
                                data={bodyCompositions}
                            />
                        </motion.div>
                    )}

                    {/* Body Fat Chart */}
                    {bodyCompositions.length >= 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                        >
                            <BodyFatChart data={bodyCompositions} />
                        </motion.div>
                    )}

                    {/* Weight Evolution Chart */}
                    {checkins.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <EvolutionCharts
                                checkins={checkins}
                                patient={patient}
                            />
                        </motion.div>
                    )}

                    {/* Photo Evolution - Read Only (galeria simples, sem botões) */}
                    {hasPhotos && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.35 }}
                        >
                            <ReadOnlyPhotoGallery checkins={checkins} patient={patient} />
                        </motion.div>
                    )}

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="text-center text-sm text-white py-6"
                    >
                        {getDailyMotivationalPhrase()}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
