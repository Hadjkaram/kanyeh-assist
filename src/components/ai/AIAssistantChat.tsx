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
// NOUVEAU: Import du SDK Google Gemini
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
  pathology: string; // Ajouté pour donner plus de contexte à l'IA
  notes: string;     // Ajouté pour donner plus de contexte à l'IA
}

// Initialisation de Gemini avec la clé API
// On utilise import.meta.env car on est sur ViteJS
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

  // NOUVEAU: La vraie fonction qui appelle Gemini
  const askGemini = async (userMessage: string, patient: PatientOption | undefined) => {
    if (!apiKey) {
      return "⚠️ Erreur : Clé API Gemini introuvable. Veuillez vérifier votre fichier .env.local.";
    }

    try {
      // On choisit le modèle flash, parfait pour un chat rapide
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // C'est ici que réside le secret : Le System Prompt (le contexte caché)
      const patientContext = patient 
        ? `Tu es un assistant médical IA nommé Kanyeh pour des cliniciens. 
           Tu dois aider le médecin à comprendre le dossier clinique de son patient.
           Voici les informations strictes du patient actuel que le médecin est en train de consulter :
           - Nom : ${patient.name}
           - Pathologie analysée : ${patient.pathology === 'breast' ? 'Cancer du Sein' : 'Cancer du Col de l\'utérus'}
           - Diagnostic retenu par le pathologiste : ${patient.diagnosis}
           - Notes du pathologiste : ${patient.notes || 'Aucune note supplémentaire.'}
           
           RÈGLES IMPORTANTES :
           1. Ne réponds qu'en rapport avec ce patient.
           2. Si on te demande de générer une ordonnance, fais-le de manière claire, formelle et structurée avec des tirets, en rapport avec le diagnostic.
           3. Reste toujours professionnel, concis et poli.
           4. Réponds toujours dans la langue de la question posée.`
        : "Tu es Kanyeh, un assistant médical IA. Demande à l'utilisateur de sélectionner un dossier patient avant de pouvoir l'aider concrètement.";

      // On assemble le contexte caché avec la question de l'utilisateur
      const finalPrompt = `${patientContext}\n\nQuestion du médecin : "${userMessage}"`;

      // On envoie la requête à Gemini
      const result = await model.generateContent(finalPrompt);
      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error("Erreur API Gemini:", error);
      return "Désolé Docteur, j'ai rencontré un problème de connexion aux serveurs de Google Gemini. Veuillez réessayer dans un instant.";
    }
  };

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
    
    // NOUVEAU : Appel de la vraie IA
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

  const suggestedQuestions = language === 'fr' 
    ? [
        "Quel est le diagnostic probable ?",
        "Quelles sont les recommandations de traitement ?",
        "Peux-tu me générer une ordonnance type pour ce diagnostic ?",
      ]
    : [
        "What is the probable diagnosis?",
        "What are the treatment recommendations?",
        "Can you generate a standard prescription for this diagnosis?",
      ];

  return (
    <Card className="h-full flex flex-col border-primary/20">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex flex-col space-y-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              {t('ai.assistantTitle')} (Powered by Gemini)
            </div>
            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse"></span>
          </CardTitle>
          
          <Select value={selectedPatient} onValueChange={handlePatientChange}>
            <SelectTrigger className="w-full bg-muted/50 border-primary/20">
              <SelectValue placeholder={language === 'fr' ? "Sélectionner un dossier patient..." : "Select a patient case..."} />
            </SelectTrigger>
            <SelectContent>
              {patients.length === 0 ? (
                <SelectItem value="none" disabled>
                  {language === 'fr' ? "Aucun dossier validé" : "No validated cases"}
                </SelectItem>
              ) : (
                patients.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.diagnosis || 'En attente'})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="py-8 text-center animate-fade-in">
              <Sparkles className="h-10 w-10 mx-auto text-primary/50 mb-3 animate-pulse-glow" />
              <p className="text-sm text-muted-foreground mb-4">
                {selectedPatient 
                  ? (language === 'fr' ? "Posez une question sur ce dossier." : "Ask a question about this case.") 
                  : (language === 'fr' ? "Sélectionnez un patient pour commencer." : "Select a patient to begin.")}
              </p>
              <div className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-primary/5 transition-colors"
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
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-accent" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t shrink-0 bg-background/50 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || t('ai.chatPlaceholder')}
              disabled={isLoading || !selectedPatient}
              className="flex-1 focus-visible:ring-primary/50"
            />
            <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading || !selectedPatient} size="icon" className="shrink-0 transition-transform active:scale-95">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistantChat;