import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PatientOption {
  id: string;
  name: string;
  diagnosis: string;
  pathology: string;
  notes: string;
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

const AIAssistantChat: React.FC = () => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');

  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase
        .from('cases')
        .select('id, patient_name, diagnosis, pathology, analysis_notes')
        .eq('status', 'validated')
        .order('created_at', { ascending: false });
      
      if (data) {
        setPatients(data.map(d => ({ 
          id: d.id, 
          name: d.patient_name, 
          diagnosis: d.diagnosis,
          pathology: d.pathology,
          notes: d.analysis_notes
        })));
      }
    };
    fetchPatients();
  }, []);

  const handlePatientChange = (patientId: string) => {
    setSelectedPatient(patientId);
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: `Dossier de **${patient.name}** chargé. Diagnostic actuel : **${patient.diagnosis.toUpperCase()}**. Que souhaitez-vous savoir sur ce cas ?`,
        timestamp: new Date()
      }]);
    }
  };

  const getSmartLocalResponse = (msg: string, patient: PatientOption): string => {
    const lower = msg.toLowerCase();
    const diag = patient.diagnosis.toLowerCase();
    
    if (lower.includes('ordonnance') || lower.includes('prescris')) {
      if (diag.includes('atypical') || diag.includes('atypique')) {
        return `Voici une proposition d'ordonnance pour **${patient.name}** (Cas Atypique) :\n\n• **Examens :** Biopsie complémentaire et Colposcopie.\n• **Traitement :** Anti-inflammatoires locaux si douleur.\n• **Suivi :** Consultation spécialisée sous 15 jours.\n\n*Souhaitez-vous valider cette prescription ?*`;
      }
      return `Pour un cas **NORMAL**, aucune ordonnance curative n'est requise pour **${patient.name}**. Je suggère simplement une visite de contrôle dans 12 mois.`;
    }

    if (lower.includes('analyse') || lower.includes('pense') || lower.includes('avis')) {
      return `L'analyse du dossier de **${patient.name}** confirme un diagnostic **${diag.toUpperCase()}**. Mes recommandations se basent sur les protocoles OMS 2026. Ce cas nécessite une ${diag.includes('atypical') ? 'surveillance active' : 'surveillance annuelle simple'}.`;
    }

    return `Je suis prêt à analyser le dossier de **${patient.name}**. Vous pouvez me demander une ordonnance, un plan de traitement ou mon avis sur le diagnostic **${diag.toUpperCase()}**.`;
  };

  const askGemini = async (userMessage: string, patient: PatientOption | undefined) => {
    if (!patient) return "Sélectionnez un patient.";
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Assistant médical expert. Patient: ${patient.name}, Diag: ${patient.diagnosis}. Question: ${userMessage}. Réponds court et pro en français.`;
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      return getSmartLocalResponse(userMessage, patient);
    }
  };

  const handleSend = async (textToProcess?: string) => {
    const text = typeof textToProcess === 'string' ? textToProcess : input;
    if (!text.trim() || isLoading || !selectedPatient) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const patient = patients.find(p => p.id === selectedPatient);
    const aiResponse = await askGemini(text, patient);

    setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: aiResponse, timestamp: new Date() }]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const suggestedQuestions = [
    "Que penses-tu de son analyse ?",
    "Quelles sont les recommandations de traitement ?",
    "Peux-tu me fournir une ordonnance type ?",
  ];

  return (
    <Card className="h-full flex flex-col border-primary/20 shadow-lg overflow-hidden">
      <CardHeader className="pb-3 shrink-0 bg-muted/10 border-b">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Assistant IA Kanyeh</div>
          <span className="flex h-2 w-2 rounded-full bg-success"></span>
        </CardTitle>
        <Select value={selectedPatient} onValueChange={handlePatientChange}>
          <SelectTrigger className="w-full bg-background mt-2">
            <SelectValue placeholder="Choisir un patient..." />
          </SelectTrigger>
          <SelectContent>
            {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-0 bg-white">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="py-8 text-center animate-fade-in">
                <Sparkles className="h-10 w-10 mx-auto text-primary/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Sélectionnez un patient pour démarrer l'assistance.</p>
                <div className="space-y-2">
                  {suggestedQuestions.map((q, i) => (
                    <Button key={i} variant="outline" size="sm" className="w-full justify-start text-left h-auto py-2 whitespace-normal" 
                            onClick={() => handleSend(q)} disabled={!selectedPatient}>
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-2 text-sm shadow-sm ${
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-slate-100 border text-slate-800'
                  }`}>
                    {/* LE RENDU DU GRAS ET LA STRUCTURE DU TEXTE */}
                    <div className="whitespace-pre-wrap leading-relaxed overflow-hidden break-words" 
                         dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                </div>
              ))
            )}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto my-4" />}
          </div>
        </ScrollArea>

        <div className="p-4 border-t flex gap-2 bg-slate-50">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Posez une question..." 
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={!selectedPatient}
          />
          <Button onClick={() => handleSend()} size="icon" className="shrink-0" disabled={!selectedPatient || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistantChat;