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

  // Mock AI responses based on context
  const getMockResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (language === 'fr') {
      if (lowerMessage.includes('diagnostic') || lowerMessage.includes('résultat')) {
        return "D'après l'analyse du rapport, le diagnostic indique une lésion de bas grade (LSIL). Je recommande un suivi colposcopique dans 6 mois. Les marqueurs p16/Ki-67 pourraient aider à stratifier le risque.";
      }
      if (lowerMessage.includes('traitement') || lowerMessage.includes('recommandation')) {
        return "Pour une LSIL chez une patiente de moins de 30 ans, la surveillance active est généralement recommandée. Un frottis de contrôle à 12 mois est conseillé selon les guidelines OMS 2023.";
      }
      if (lowerMessage.includes('sein') || lowerMessage.includes('mammaire')) {
        return "L'analyse montre une masse de catégorie BI-RADS 4a. Une biopsie est recommandée. Le score Ki-67 de 15% suggère une prolifération modérée.";
      }
      return "Je suis l'assistant IA de KANYEH ASSIST. Je peux vous aider à interpréter les résultats de pathologie, suggérer des examens complémentaires, ou expliquer les protocoles de suivi. Comment puis-je vous aider?";
    } else {
      if (lowerMessage.includes('diagnosis') || lowerMessage.includes('result')) {
        return "Based on the report analysis, the diagnosis indicates a low-grade lesion (LSIL). I recommend colposcopic follow-up in 6 months. P16/Ki-67 markers could help stratify the risk.";
      }
      if (lowerMessage.includes('treatment') || lowerMessage.includes('recommendation')) {
        return "For LSIL in a patient under 30, active surveillance is generally recommended. A follow-up smear at 12 months is advised according to WHO 2023 guidelines.";
      }
      if (lowerMessage.includes('breast') || lowerMessage.includes('mammary')) {
        return "The analysis shows a BI-RADS category 4a mass. Biopsy is recommended. The Ki-67 score of 15% suggests moderate proliferation.";
      }
      return "I am the KANYEH ASSIST AI assistant. I can help you interpret pathology results, suggest additional tests, or explain follow-up protocols. How can I help you?";
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: getMockResponse(userMessage.content),
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = language === 'fr' 
    ? [
        "Quel est le diagnostic probable?",
        "Quelles sont les recommandations de traitement?",
        "Quels examens complémentaires suggérez-vous?",
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
            <div className="py-8 text-center">
              <Sparkles className="h-10 w-10 mx-auto text-primary/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                {t('ai.chatWelcome')}
              </p>
              <div className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => {
                      setInput(question);
                    }}
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
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder || t('ai.chatPlaceholder')}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistantChat;
