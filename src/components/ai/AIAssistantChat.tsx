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

interface AIAssistantChatProps {
  context?: string;
  placeholder?: string;
}

interface PatientOption {
  id: string;
  name: string;
  diagnosis: string;
  pathology: string;
  notes: string;
}

// Initialisation de Gemini
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "CLE_MANQUANTE");

const AIAssistantChat: React.FC<AIAssistantChatProps> = ({ context, placeholder }) => {
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
      const diagStr = patient.diagnosis ? patient.diagnosis.toUpperCase() : 'En attente';
      const welcomeText = language === 'fr' 
        ? `Dossier de **${patient.name}** chargé (Diagnostic actuel : **${diagStr}**). Que souhaitez-vous savoir sur ce cas précis ?`
        : `**${patient.name}**'s case loaded (Current diagnosis: **${diagStr}**). What would you like to know about this specific case?`;
        
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: welcomeText,
          timestamp: new Date()
        }
      ]);
    }
  };

  // --- FONCTION ASK GEMINI MISE À JOUR (DEBUG + STABILITÉ) ---
  const askGemini = async (userMessage: string, patient: PatientOption | undefined) => {
    // Debug log pour voir si la clé API est détectée
    console.log("Vérification clé API présente:", !!import.meta.env.VITE_GEMINI_API_KEY);

    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === "CLE_MANQUANTE") {
      return "⚠️ Erreur : La clé API n'est pas détectée par Vercel. Vérifiez l'onglet Environment Variables (doit commencer par VITE_).";
    }

    try {
      // Utilisation du modèle flash standard
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const patientContext = patient 
        ? `Tu es Kanyeh, assistant médical expert pour des cliniciens. 
           Informations du patient actuel :
           - Nom : ${patient.name}
           - Diagnostic : ${patient.diagnosis}
           - Pathologie : ${patient.pathology}
           - Notes : ${patient.notes || 'N/A'}
           
           Règles : Réponds de manière professionnelle, concise et en français. 
           Si on demande une ordonnance, fournis une structure claire avec des tirets.`
        : "Veuillez sélectionner un patient.";

      const result = await model.generateContent(`${patientContext}\n\nQuestion du médecin : ${userMessage}`);
      const response = await result.response;
      return response.text();

    } catch (error: any) {
      console.error("Détail erreur Gemini:", error);
      return `Erreur technique : ${error.message}. Vérifiez que la clé API sur Vercel est correcte et n'a pas expiré.`;
    }
  };
  // ----------------------------------------------------------

  const handleSend = async (textToProcess?: string) => {
    const text = typeof textToProcess === 'string' ? textToProcess : input;
    
    if (!text.trim() || isLoading || !selectedPatient) {
      if (!selectedPatient) {
        toast.warning(language === 'fr' ? "Veuillez d'abord sélectionner un patient." : "Please select a patient first.");
      }
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const patient = patients.find(p => p.id === selectedPatient);
    const aiResponseText = await askGemini(text, patient);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponseText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "Quel est le diagnostic probable ?",
    "Quelles sont les recommandations de traitement ?",
    "Génère-moi une ordonnance type.",
  ];

  return (
    <Card className="h-full flex flex-col border-primary/20">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex flex-col space-y-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              {t('ai.assistantTitle')} (Gemini)
            </div>
            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse"></span>
          </CardTitle>
          
          <Select value={selectedPatient} onValueChange={handlePatientChange}>
            <SelectTrigger className="w-full bg-muted/50 border-primary/20">
              <SelectValue placeholder="Sélectionner un dossier patient..." />
            </SelectTrigger>
            <SelectContent>
              {patients.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.diagnosis || 'En attente'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="py-8 text-center">
              <Sparkles className="h-10 w-10 mx-auto text-primary/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Sélectionnez un patient pour commencer l'analyse.
              </p>
              <div className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => handleSend(question)}
                    disabled={!selectedPatient}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-background/50">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez une question..."
              disabled={isLoading || !selectedPatient}
              className="flex-1"
            />
            <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading || !selectedPatient} size="icon">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistantChat;