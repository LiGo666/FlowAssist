"use client";

import { useState, useEffect } from "react";
import { MessageList, type Message, type MessageOption } from "@/components/assist/message-list";
import { MessageInput } from "@/components/assist/message-input";
import { UserContextPanel, type UserContext } from "@/components/assist/user-context-panel";
import { ToolsPanel, type Tool } from "@/components/assist/tools-panel";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCcwIcon } from "lucide-react";

// Sample screenshot image for demo
const SAMPLE_SCREENSHOT = "https://images.unsplash.com/photo-1609672731433-58f2c255f044?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80";

// Define interactions for the demo scenario
type InteractionStage = 
  | "initial" 
  | "nameChangeRequest" 
  | "contactProvided" 
  | "confirmEmailChange"
  | "emailChangeConfirmed"
  | "emailChangeDeclined";

interface DemoState {
  stage: InteractionStage;
  lastMessageId: string | null;
}

// Name change demo scenario messages
const nameChangeMessages: Message[] = [
  {
    id: "initial-1",
    content: "I recently got married and changed my name. I need to update my information in the company systems.",
    role: "user",
    timestamp: new Date(Date.now() - 60000 * 15),
    attachments: [
      {
        type: "image",
        url: SAMPLE_SCREENSHOT,
        preview: SAMPLE_SCREENSHOT
      }
    ],
    children: []
  },
  {
    id: "initial-2",
    content: "Congratulations on your marriage! I'd be happy to help you update your name in our company systems. I'll need to guide you through the process as this involves multiple systems and requires proper documentation.",
    role: "assistant",
    timestamp: new Date(Date.now() - 60000 * 14),
    parentId: "initial-1",
    children: []
  },
  {
    id: "initial-3",
    content: "First, you'll need to contact our Identity and Access Management (GIAM) team to update your official records. They handle all name changes in our core systems. Would you like me to provide you with the contact information for the GIAM team?",
    role: "assistant",
    timestamp: new Date(Date.now() - 60000 * 13),
    parentId: "initial-2",
    options: [
      { id: "option-yes-contact", text: "Yes, please provide contact info", icon: "check" },
      { id: "option-no-contact", text: "No thanks, I'll find it myself", icon: "x" }
    ],
    children: []
  },
  {
    id: "contact-1",
    content: "Yes, please provide me with their contact information.",
    role: "user",
    timestamp: new Date(Date.now() - 60000 * 12),
    parentId: "initial-3",
    children: []
  },
  {
    id: "contact-2",
    content: "Here's the contact information for our Identity & Access Management team:",
    role: "assistant",
    timestamp: new Date(Date.now() - 60000 * 11),
    parentId: "contact-1",
    contactInfo: {
      name: "Meera Sharma",
      role: "GIAM Team Lead",
      email: "giam-support@company.com"
    },
    children: []
  },
  {
    id: "contact-3",
    content: "You'll need to submit the following documents to the GIAM team:\n\n1. Copy of your marriage certificate\n2. Completed Name Change Request Form (available on the intranet)\n3. Copy of your updated government ID\n\nOnce they process your request, your name will be updated in the central directory, which will then propagate to most other systems within 24-48 hours.",
    role: "assistant",
    timestamp: new Date(Date.now() - 60000 * 10),
    parentId: "contact-2",
    children: []
  },
  {
    id: "contact-4",
    content: "I can also help you with updating your email address to reflect your new name. Would you like me to initiate that process? Note that this might cause temporary issues with some certificates and system access during the transition.",
    role: "assistant",
    timestamp: new Date(Date.now() - 60000 * 9),
    parentId: "contact-3",
    warning: "Changing your email address may temporarily affect your access to certain systems and applications. Your old email will be set up as an alias for a transition period of 90 days.",
    options: [
      { id: "option-yes-email", text: "Yes, update my email", icon: "check" },
      { id: "option-no-email", text: "No, keep current email", icon: "x" }
    ],
    children: []
  }
];

// Initial empty messages array
const emptyMessages: Message[] = [];

const sampleUserContext: UserContext = {
  name: "Alex Johnson",
  role: "Marketing Specialist",
  department: "Digital Marketing",
  technicalFamiliarity: "Intermediate",
  communicationStyle: "Casual",
};

const sampleTools: Tool[] = [
  {
    id: "hr-knowledge",
    name: "HR Knowledge Base",
    description: "Access HR policies and procedures",
    icon: "book",
    active: true,
  },
  {
    id: "it-support",
    name: "IT Support",
    description: "Technical troubleshooting assistance",
    icon: "wrench",
  },
  {
    id: "intranet",
    name: "Intranet Search",
    description: "Search company intranet resources",
    icon: "database",
  },
  {
    id: "org-chart",
    name: "Organization Chart",
    description: "View company structure and contacts",
    icon: "info",
  },
];

export default function AssistPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("conversation");
  const [demoState, setDemoState] = useState<DemoState>({ 
    stage: "initial", 
    lastMessageId: null 
  });

  useEffect(() => {
    // Load conversation from local storage or start with empty array
    const storedMessages = localStorage.getItem("assistMessages");
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        // Convert string dates back to Date objects
        parsedMessages.forEach((msg: any) => {
          msg.timestamp = new Date(msg.timestamp);
        });
        setMessages(parsedMessages);
      } catch (error) {
        console.error("Failed to parse stored messages:", error);
        setMessages([]);
      }
    }
  }, []);

  useEffect(() => {
    // Save conversation to local storage when it changes
    if (messages.length > 0) {
      localStorage.setItem("assistMessages", JSON.stringify(messages));
    }
  }, [messages]);

  // Handle user selection of options in messages
  const handleSelectOption = (messageId: string, optionId: string) => {
    // Find the message with the selected option
    const message = messages.find(msg => msg.id === messageId);
    if (!message || !message.options) return;

    // Find the selected option
    const option = message.options.find(opt => opt.id === optionId);
    if (!option) return;

    // Handle different option selections based on the demo flow
    if (optionId === 'option-yes-contact') {
      // User wants contact info for GIAM team
      const userReply: Message = {
        id: 'contact-1',
        content: 'Yes, please provide me with their contact information.',
        role: 'user',
        timestamp: new Date(),
        parentId: messageId,
        children: []
      };
      
      // Find if this message already exists (to avoid duplicates)
      if (!messages.find(msg => msg.id === userReply.id)) {
        setMessages(prev => [...prev, userReply]);
        
        // Add remaining contact flow messages if they don't exist
        const contactResponses = nameChangeMessages.filter(msg => 
          ['contact-2', 'contact-3', 'contact-4'].includes(msg.id) && 
          !messages.some(existingMsg => existingMsg.id === msg.id)
        );
        
        if (contactResponses.length > 0) {
          setTimeout(() => {
            setMessages(prev => [...prev, ...contactResponses]);
            setDemoState({ stage: 'contactProvided', lastMessageId: 'contact-4' });
          }, 1000);
        }
      }
    } else if (optionId === 'option-yes-email') {
      // User wants to update email address
      const userReply: Message = {
        id: 'email-1',
        content: 'Yes, please help me update my email address.',
        role: 'user',
        timestamp: new Date(),
        parentId: messageId,
        children: []
      };
      
      setMessages(prev => [...prev, userReply]);
      
      // Assistant confirmation with certificate warning
      setTimeout(() => {
        const assistantResponse: Message = {
          id: 'email-2',
          content: "I'll initiate the email change process for you. Your new email will be created based on your updated name in the GIAM system.",
          role: 'assistant',
          timestamp: new Date(),
          parentId: 'email-1',
          warning: "Important: After your email address changes, you may need to update certificates in some applications. The IT Service Desk can assist with any issues that arise.",
          children: []
        };
        
        setMessages(prev => [...prev, assistantResponse]);
        setDemoState({ stage: 'emailChangeConfirmed', lastMessageId: 'email-2' });
        
        toast.success("Email change process initiated", {
          description: "The assistant has started the email change process.",
          position: "bottom-right",
        });
      }, 1500);
    } else if (optionId === 'option-no-email') {
      // User doesn't want to update email
      const userReply: Message = {
        id: 'no-email-1',
        content: 'No, I prefer to keep my current email address for now.',
        role: 'user',
        timestamp: new Date(),
        parentId: messageId,
        children: []
      };
      
      setMessages(prev => [...prev, userReply]);
      
      // Assistant acknowledgment
      setTimeout(() => {
        const assistantResponse: Message = {
          id: 'no-email-2',
          content: "That's completely fine. Your name will be updated in the central directory while your email address remains unchanged. If you decide to change it later, you can always reach out to the GIAM team.",
          role: 'assistant',
          timestamp: new Date(),
          parentId: 'no-email-1',
          children: []
        };
        
        setMessages(prev => [...prev, assistantResponse]);
        setDemoState({ stage: 'emailChangeDeclined', lastMessageId: 'no-email-2' });
      }, 1500);
    }
  };

  const handleSendMessage = (content: string, attachments?: File[]) => {
    if (content.trim() === "" && (!attachments || attachments.length === 0)) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      role: "user",
      timestamp: new Date(),
      children: [],
    };

    // If there are attachments, add them to the message
    if (attachments && attachments.length > 0) {
      userMessage.attachments = attachments.map(file => ({
        type: file.type.startsWith('image/') ? 'image' : 'file',
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }));
    }

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate assistant thinking
    setTimeout(() => {
      // Simulate assistant response
      const assistantResponse: Message = {
        id: `msg-${Date.now()}`,
        content: generateAssistantResponse(content),
        role: "assistant",
        timestamp: new Date(),
        parentId: userMessage.id,
        children: []
      };
      setMessages(prev => [...prev, assistantResponse]);
      setIsLoading(false);
      
      // Show toast notification
      toast.success("Assistant responded", {
        description: "The assistant provided an answer to your query.",
        position: "bottom-right",
      });
    }, 1500);
  };

  // Simple function to generate mock assistant responses
  const generateAssistantResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return "Hello! How can I assist you today?";
    } else if (lowerMessage.includes("thank")) {
      return "You're welcome! Is there anything else I can help you with?";
    } else if (lowerMessage.includes("policy") || lowerMessage.includes("document")) {
      return "Let me search for the relevant policy documents. According to our knowledge base, you can find the most up-to-date company policies on the intranet portal under 'HR Resources > Policies'.";
    } else {
      return "I understand your request. Let me help you with that. Could you provide a bit more context so I can give you the most accurate information?";
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
    localStorage.removeItem("assistMessages");
    setDemoState({ stage: 'initial', lastMessageId: null });
    toast.info("Conversation cleared", {
      description: "All messages have been deleted.",
      position: "bottom-right",
    });
  };

  const loadSampleConversation = () => {
    setMessages(nameChangeMessages);
    localStorage.setItem("assistMessages", JSON.stringify(nameChangeMessages));
    setDemoState({ stage: 'contactProvided', lastMessageId: 'contact-4' });
    toast.info("Name change demo loaded", {
      description: "A sample conversation for the name change scenario has been loaded.",
      position: "bottom-right",
    });
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left sidebar - visible on large screens */}
        <div className="lg:col-span-3 lg:block hidden">
          <div className="space-y-6">
            <UserContextPanel userContext={sampleUserContext} />
            <ToolsPanel tools={sampleTools} onSelectTool={() => {}} />
          </div>
        </div>
        
        {/* Mobile tabs for sidebar content */}
        <div className="lg:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="context" className="text-white data-[state=active]:bg-blue-600">
                User Context
              </TabsTrigger>
              <TabsTrigger value="tools" className="text-white data-[state=active]:bg-blue-600">
                Tools
              </TabsTrigger>
            </TabsList>
            <TabsContent value="context" className="mt-2">
              <UserContextPanel userContext={sampleUserContext} />
            </TabsContent>
            <TabsContent value="tools" className="mt-2">
              <ToolsPanel tools={sampleTools} onSelectTool={() => {}} />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Main conversation area */}
        <div className="lg:col-span-6 flex flex-col h-[calc(100vh-2rem)]">
          <div className="flex-1 overflow-hidden pb-2">
            <Card className="h-full border-white/20 bg-white/5 backdrop-blur-sm shadow-xl">
              <MessageList messages={messages} onSelectOption={handleSelectOption} />
            </Card>
          </div>
          
          <div className="mt-2">
            <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
        
        {/* Right sidebar */}
        <div className="lg:col-span-3 lg:block hidden">
          <div className="flex flex-col h-full gap-4">
            <Card className="flex-1 p-4 border-white/20 bg-white/5 backdrop-blur-sm shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Conversation</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleClearConversation}
                    className="text-xs border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    Clear
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadSampleConversation}
                    className="text-xs border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <RefreshCcwIcon className="h-3 w-3 mr-1" />
                    Load Sample
                  </Button>
                </div>
              </div>
              
              {/* Additional controls or info could go here */}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
