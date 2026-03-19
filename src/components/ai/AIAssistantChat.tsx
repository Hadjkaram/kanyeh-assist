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
  const { t, language } = useLanguage();
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
        content: `Dossier de **${patient.name}** chargé. Comment puis-je vous aider pour ce cas de ${patient.pathology === 'breast' ? 'cancer du sein' : 'cancer du col'} ?`,
        timestamp: new Date()
      }]);
    }
  };

  // CERVEAU DE SECOURS (Si Gemini échoue)
  const getLocalResponse = (msg: string, patient: PatientOption): string => {
    const lower = msg.toLowerCase();
    const name = patient.name;
    const diag = patient.diagnosis.toLowerCase();

    if (lower.includes('ordonnance') || lower.includes('prescris')) {
      return `Voici une proposition d'ordonnance pour **${name}** :\n\n- Suivi oncologique spécialisé\n- Bilan biologique complet\n- Prochain contrôle dans 3 mois.\n\nSouhaitez-vous l'envoyer sur Pass Santé ?`;
    }
    if (lower.includes('analyse') || lower.includes('pense') || lower.includes('avis')) {
      return `L'analyse pour **${name}** montre un état **${diag}**. ${diag === 'normal' ? 'C\'est un excellent résultat, une surveillance annuelle suffit.' : 'Une prise en charge rapide est recommandée.'}`;
    }
    return `Je traite les données de **${name}**. Ce cas présente un diagnostic **${diag}**. Avez-vous besoin d'une ordonnance ou d'un protocole de traitement ?`;
  };

  const askGemini = async (userMessage: string, patient: PatientOption | undefined) => {
    if (!apiKey || !patient) return "Veuillez sélectionner un patient.";

    try {
      // On tente Gemini Flash 1.5
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Assistant médical expert. Patient: ${patient.name}, Diag: ${patient.diagnosis}. Question: ${userMessage}. Réponds court en français.`;
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.warn("Gemini bloqué par région, bascule sur cerveau local.");
      // BASCULE AUTOMATIQUE SUR LE CERVEAU LOCAL SI GOOGLE BLOQUE
      return getLocalResponse(userMessage, patient);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !selectedPatient) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const patient = patients.find(p => p.id === selectedPatient);
    const aiResponse = await askGemini(input, patient);

    setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: aiResponse, timestamp: new Date() }]);
    setIsLoading(false);
  };

  return (
    <Card className="h-full flex flex-col border-primary/20 shadow-lg">
      <CardHeader className="pb-3 shrink-0 bg-muted/20">
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
      <CardContent className="flex-1 flex flex-col min-h-0 p-0 bg-slate-50/50">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-2 text-sm shadow-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white border text-slate-800'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto my-4" />}
          </div>
        </ScrollArea>
        <div className="p-4 border-t flex gap-2 bg-white">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Posez une question..." onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
          <Button onClick={handleSend} size="icon" className="shrink-0"><Send className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistantChat;