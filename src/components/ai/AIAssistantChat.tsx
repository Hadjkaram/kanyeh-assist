import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';

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

const AIAssistantChat: React.FC<AIAssistantChatProps> = ({ context, placeholder }) => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      return "En tant qu'assistant clinique de KANYEH ASSIST, je base mes réponses sur le dossier actuel. Je peux vous aider à formuler un plan de traitement, interpréter les marqueurs, ou chercher des protocoles médicaux. Que souhaitez-vous explorer ?";
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
      return "I am the KANYEH ASSIST clinical assistant. I base my responses on the current case file. I can help you formulate a treatment plan, interpret markers, or search for medical protocols. What would you like to do?";
    }
  };

  // NOUVEAU : La fonction handleSend gère les entrées manuelles ET les clics sur les suggestions
  const handleSend = async (textToProcess?: string) => {
    const text = typeof textToProcess === 'string' ? textToProcess : input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulation du délai de réflexion de l'IA
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

  // Défilement automatique vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Écoute de la touche Entrée
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
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          {t('ai.assistantTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="py-8 text-center animate-fade-in">
              <Sparkles className="h-10 w-10 mx-auto text-primary/50 mb-3 animate-pulse-glow" />
              <p className="text-sm text-muted-foreground mb-4">
                {t('ai.chatWelcome')}
              </p>
              <div className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-primary/5 transition-colors"
                    onClick={() => handleSend(question)} // L'envoi est maintenant automatique au clic !
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
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
              disabled={isLoading}
              className="flex-1 focus-visible:ring-primary/50"
            />
            <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading} size="icon" className="shrink-0 transition-transform active:scale-95">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistantChat;