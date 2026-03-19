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
        content: `Dossier de **${patient.name}** chargé. Je suis prêt pour l'analyse.`,
        timestamp: new Date()
      }]);
    }
  };

  const askGemini = async (userMessage: string, patient: PatientOption | undefined) => {
    if (!apiKey) return "Clé API manquante dans Vercel.";

    // Liste des modèles à tester par ordre de priorité
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.0-pro"];
    let lastError = "";

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const patientContext = patient 
          ? `Tu es Kanyeh, assistant médical expert. Patient: ${patient.name}, Diag: ${patient.diagnosis}.`
          : "Assistant médical Kanyeh.";

        const result = await model.generateContent(`${patientContext}\n\nQuestion: ${userMessage}`);
        const response = await result.response;
        return response.text();
      } catch (error: any) {
        lastError = error.message;
        console.warn(`Échec avec le modèle ${modelName}, tentative suivante...`);
        continue; // On passe au modèle suivant si celui-ci fait une 404
      }
    }

    return `Erreur finale : ${lastError}. Google semble restreindre l'accès aux modèles dans votre région ou la clé est invalide.`;
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
    <Card className="h-full flex flex-col border-primary/20">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Assistant Kanyeh</div>
          <span className="flex h-2 w-2 rounded-full bg-success animate-pulse"></span>
        </CardTitle>
        <Select value={selectedPatient} onValueChange={handlePatientChange}>
          <SelectTrigger className="w-full bg-muted/50 mt-2">
            <SelectValue placeholder="Choisir un patient..." />
          </SelectTrigger>
          <SelectContent>
            {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />}
          </div>
        </ScrollArea>
        <div className="p-4 border-t flex gap-2 bg-background">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Posez une question..." onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
          <Button onClick={handleSend} size="icon"><Send className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistantChat;