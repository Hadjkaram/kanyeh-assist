import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // NOUVEAU
import { useLanguage } from '@/contexts/LanguageContext';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // NOUVEAU
import { toast } from 'sonner';

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

// NOUVEAU: Interface pour le menu déroulant
interface PatientOption {
  id: string;
  name: string;
  diagnosis: string;
}

const AIAssistantChat: React.FC<AIAssistantChatProps> = ({ context, placeholder }) => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // NOUVEAU: États pour la sélection du patient
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');

  // NOUVEAU: Récupération des patients validés
  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase
        .from('cases')
        .select('id, patient_name, diagnosis')
        .eq('status', 'validated')
        .order('created_at', { ascending: false });
      
      if (data) {
        setPatients(data.map(d => ({ id: d.id, name: d.patient_name, diagnosis: d.diagnosis })));
      }
    };
    fetchPatients();
  }, []);

  // NOUVEAU: Message automatique quand on choisit un patient
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

  // Moteur de réponses IA mocké (beaucoup plus intelligent et conversationnel)
  const getMockResponse = (userMessage: string, patientName?: string, patientDiag?: string): string => {
    const msg = userMessage.toLowerCase();
    const pName = patientName || "ce patient";
    const diag = patientDiag ? patientDiag.toLowerCase() : "en attente";
    
    if (language === 'fr') {
      // 1. Réponse à la demande d'Ordonnance
      if (msg.includes('ordonnance') || msg.includes('prescris') || msg.includes('prescription')) {
        return `Voici une proposition d'ordonnance type pour **${pName}** basée sur son diagnostic (${diag}) :\n\n📝 **ORDONNANCE MÉDICALE**\n\n**Motif :** Suivi clinique post-diagnostic anatomopathologique.\n\n1. **Consultation :** Visite de contrôle gynécologique/sénologique recommandée.\n2. **Imagerie/Biologie :** Bilan de routine sous 6 mois.\n3. **Recommandations :** Contacter immédiatement le centre en cas d'apparition de nouveaux symptômes (douleurs, saignements).\n\n*Souhaitez-vous que je transmette cette ordonnance directement dans le DMP du patient via PASS SANTÉ ?*`;
      }

      // 2. Réponse à "Que penses-tu de son analyse ?"
      if (msg.includes('pense') || msg.includes('analyse') || msg.includes('avis')) {
        if (diag === 'normal' || diag.includes('benin') || diag.includes('bénin')) {
           return `L'analyse de **${pName}** est très rassurante. Le diagnostic est **${diag}**. Sur le plan clinique, aucune intervention chirurgicale ou médicamenteuse agressive n'est requise. Une simple surveillance de routine est amplement suffisante.`;
        } else if (diag === 'suspicious' || diag.includes('atypique') || diag.includes('atypical')) {
           return `Le cas de **${pName}** présente des atypies cellulaires (**${diag}**). Il n'y a pas de malignité franche confirmée, mais la prudence est de rigueur. Je vous suggère fortement de programmer une biopsie complémentaire ou une colposcopie sous 4 à 6 semaines.`;
        } else if (diag === 'malignant' || diag.includes('malin')) {
           return `Le diagnostic de **${pName}** est **${diag}**. C'est un dossier prioritaire qui doit être présenté en RCP (Réunion de Concertation Pluridisciplinaire). Le profil tissulaire indique qu'une prise en charge oncologique (exérèse chirurgicale / chimiothérapie) devra être discutée rapidement.`;
        }
        return `Les résultats d'analyse pour **${pName}** sont actuellement qualifiés de "${diag}". Quel aspect spécifique de ce diagnostic souhaitez-vous que j'approfondisse ?`;
      }

      // 3. Réponse aux traitements généraux
      if (msg.includes('traitement') || msg.includes('recommandation') || msg.includes('suite') || msg.includes('faire')) {
        return `Pour une classification **${diag}**, le protocole international (OMS 2023) recommande d'adapter l'intervention à l'âge et aux antécédents du patient. Voulez-vous que je génère une ordonnance type pour anticiper la prochaine consultation ?`;
      }

      // 4. Salutations
      if (msg.includes('merci') || msg.includes('ok') || msg.includes('d\'accord') || msg.includes('parfait')) {
        return `Je vous en prie, Docteur. Je reste à votre disposition pour le suivi de **${pName}** ou de tout autre patient.`;
      }

      // 5. Fallback Intelligent
      return `Je parcours le dossier de **${pName}**. Pourriez-vous préciser votre demande ? Vous pouvez me demander par exemple : "Que penses-tu de son analyse ?", "Génère une ordonnance", ou "Quelles sont les options de traitement ?"`;
    } else {
      if (msg.includes('prescription') || msg.includes('draft')) {
        return `Here is a standard prescription draft for **${pName}** based on the ${diag} diagnosis.\n\nWould you like me to send it directly to their EMR?`;
      }
      if (msg.includes('think') || msg.includes('analysis') || msg.includes('opinion')) {
        return `The analysis for **${pName}** shows a **${diag}** diagnosis. Based on current guidelines, active surveillance is recommended.`;
      }
      if (msg.includes('thanks') || msg.includes('ok') || msg.includes('great')) {
        return "You're welcome, Doctor. Don't hesitate if you have any other questions.";
      }
      return `I am reviewing **${pName}**'s file. Please specify if you need a treatment plan, an analysis review, or a prescription draft.`;
    }
  };

  const handleSend = async (textToProcess?: string) => {
    const text = typeof textToProcess === 'string' ? textToProcess : input;
    // NOUVEAU : On bloque l'envoi si aucun patient n'est sélectionné
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

    await new Promise(resolve => setTimeout(resolve, 1500));

    // NOUVEAU : On récupère les infos du patient pour le cerveau
    const patient = patients.find(p => p.id === selectedPatient);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: getMockResponse(text, patient?.name, patient?.diagnosis),
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
        "Que penses-tu de son analyse ?",
        "Quelles sont les recommandations de traitement ?",
        "Oui, génère moi une ordonnance type.",
      ]
    : [
        "What do you think of this analysis?",
        "What are the treatment recommendations?",
        "Yes, generate a standard prescription.",
      ];

  return (
    <Card className="h-full flex flex-col border-primary/20">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex flex-col space-y-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              {t('ai.assistantTitle')}
            </div>
            {/* NOUVEAU: Petit badge de statut */}
            <span className="flex h-2 w-2 rounded-full bg-success"></span>
          </CardTitle>
          
          {/* NOUVEAU: Le Sélecteur de patient */}
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
                {/* NOUVEAU : Message conditionnel */}
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
                    disabled={!selectedPatient} // NOUVEAU: Bloqué si pas de patient
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
                    {/* NOUVEAU: On permet un rendu HTML basique pour le gras des messages automatiques */}
                    <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
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
              disabled={isLoading || !selectedPatient} // NOUVEAU: Bloqué si pas de patient
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