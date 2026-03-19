import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // NOUVEAU
import { useLanguage } from '@/contexts/LanguageContext';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // NOUVEAU

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
  const getMockResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (language === 'fr') {
      if (lowerMessage.includes('diagnostic') || lowerMessage.includes('résultat') || lowerMessage.includes('probable')) {
        return "D'après l'analyse du rapport, le diagnostic indique une lésion de bas grade (LSIL). Je recommande un suivi colposcopique dans 6 mois. Les marqueurs p16/Ki-67 pourraient aider à stratifier le risque.";
      }
      if (lowerMessage.includes('traitement') || lowerMessage.includes('recommandation') || lowerMessage.includes('quoi') || lowerMessage.includes('autre') || lowerMessage.includes('suite')) {
        return "Pour la suite, une surveillance active est généralement recommandée pour ce type de lésion (LSIL) chez une patiente jeune. Un frottis de contrôle à 12 mois est conseillé selon les directives de l'OMS 2023. Souhaitez-vous que je génère une ordonnance type ?";
      }
      if (lowerMessage.includes('examen') || lowerMessage.includes('complémentaire')) {
        return "Je suggère une colposcopie avec test HPV. Voulez-vous que je vérifie les disponibilités dans les centres partenaires ou que je prépare la demande d'examen ?";
      }
      if (lowerMessage.includes('sein') || lowerMessage.includes('mammaire')) {
        return "L'analyse montre une masse de catégorie BI-RADS 4a. Une biopsie est recommandée. Le score Ki-67 de 15% suggère une prolifération modérée.";
      }
      if (lowerMessage.includes('merci') || lowerMessage.includes('ok') || lowerMessage.includes('d\'accord') || lowerMessage.includes('parfait')) {
        return "Je vous en prie, Docteur. N'hésitez pas si vous avez d'autres questions sur ce dossier ou si vous souhaitez analyser un autre patient.";
      }
      // Modifié légèrement pour utiliser le patient sélectionné s'il y en a un
      const patientName = patients.find(p => p.id === selectedPatient)?.name;
      return patientName 
        ? `En tant qu'assistant clinique, je base mes réponses sur le dossier de ${patientName}. Je peux vous aider à formuler un plan de traitement ou chercher des protocoles médicaux adaptés.`
        : "Veuillez d'abord sélectionner un patient dans le menu déroulant en haut pour que je puisse vous répondre précisément.";
    } else {
      if (lowerMessage.includes('diagnosis') || lowerMessage.includes('result') || lowerMessage.includes('probable')) {
        return "Based on the report analysis, the diagnosis indicates a low-grade lesion (LSIL). I recommend colposcopic follow-up in 6 months. P16/Ki-67 markers could help stratify the risk.";
      }
      if (lowerMessage.includes('treatment') || lowerMessage.includes('recommendation') || lowerMessage.includes('what else') || lowerMessage.includes('next')) {
        return "For LSIL in a patient under 30, active surveillance is generally recommended. A follow-up smear at 12 months is advised according to WHO 2023 guidelines. Would you like me to draft a standard prescription?";
      }
      if (lowerMessage.includes('test') || lowerMessage.includes('additional')) {
        return "I suggest a colposcopy with HPV testing. Would you like me to check availability in partner centers?";
      }
      if (lowerMessage.includes('breast') || lowerMessage.includes('mammary')) {
        return "The analysis shows a BI-RADS category 4a mass. Biopsy is recommended. The Ki-67 score of 15% suggests moderate proliferation.";
      }
      if (lowerMessage.includes('thanks') || lowerMessage.includes('ok') || lowerMessage.includes('great')) {
        return "You're welcome, Doctor. Don't hesitate if you have any other questions about this case or another patient.";
      }
      return "Please select a patient from the dropdown menu first so I can give you accurate information.";
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

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: getMockResponse(text),
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
        "Quels examens complémentaires suggérez-vous ?",
      ]
    : [
        "What is the probable diagnosis?",
        "What are the treatment recommendations?",
        "What additional tests do you suggest?",
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