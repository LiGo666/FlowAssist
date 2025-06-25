"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageIcon, CheckIcon, XIcon, AlertTriangleIcon, UserIcon, InfoIcon } from "lucide-react";

export type MessageOption = {
  id: string;
  text: string;
  action?: string;
  icon?: string;
};

export type Message = {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
  parentId?: string;
  options?: MessageOption[];
  attachments?: { type: string; url: string; preview?: string }[];
  contactInfo?: { name: string; role: string; email: string };
  children: Message[];
  warning?: string;
};

interface MessageListProps {
  messages: Message[];
  onSelectOption: (messageId: string, optionId: string) => void;
}

export function MessageList({ messages, onSelectOption }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Function to build the message tree
  const buildMessageTree = (messages: Message[]) => {
    const messageMap = new Map<string, Message & { children: Message[] }>();
    
    // First pass: Create map entries for all messages
    messages.forEach(message => {
      messageMap.set(message.id, { ...message, children: [] });
    });
    
    // Second pass: Build parent-child relationships
    const rootMessages: (Message & { children: Message[] })[] = [];
    
    messages.forEach(message => {
      const messageWithChildren = messageMap.get(message.id)!;
      
      if (message.parentId && messageMap.has(message.parentId)) {
        const parent = messageMap.get(message.parentId)!;
        parent.children.push(messageWithChildren);
      } else {
        rootMessages.push(messageWithChildren);
      }
    });
    
    return rootMessages;
  };

  const renderMessage = (message: Message & { children: Message[] }, isChild = false) => {
    const isUser = message.role === "user";
    
    return (
      <div key={message.id} className="relative">
        {/* Connection line to parent */}
        {isChild && (
          <div className="absolute left-4 -top-6 w-0.5 h-6 border-l-2 border-dashed border-red-500/60"></div>
        )}
        
        <div
          className={cn(
            "flex gap-3 relative",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
          aria-label={`${message.role} message`}
        >
          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center z-10">
            <Avatar className={isUser ? "border-2 border-blue-500" : "border-2 border-white/30"}>
              {isUser ? (
                <>
                  <AvatarImage 
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" 
                    alt="User avatar"
                  />
                  <AvatarFallback>U</AvatarFallback>
                </>
              ) : (
                <>
                  <AvatarImage 
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=assistant" 
                    alt="Assistant avatar"
                  />
                  <AvatarFallback>A</AvatarFallback>
                </>
              )}
            </Avatar>
          </div>
          
          {/* Message content */}
          <div
            className={cn(
              "rounded-xl px-5 py-4 max-w-[85%] sm:max-w-[75%] shadow-lg",
              isUser
                ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                : "bg-white/15 backdrop-blur-md text-white border border-white/20"
            )}
          >
            {/* Message text */}
            <div className="prose prose-sm dark:prose-invert">
              <p className="m-0 leading-relaxed break-words">{message.content}</p>
            </div>
            
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.attachments.map((attachment, idx) => (
                  <div 
                    key={idx} 
                    className="relative rounded-md overflow-hidden border border-white/30 w-32 h-24 bg-black/20"
                  >
                    {attachment.preview ? (
                      <img 
                        src={attachment.preview} 
                        alt="Attachment preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <ImageIcon className="w-8 h-8 text-white/50" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Contact information */}
            {message.contactInfo && (
              <div className="mt-3 p-3 rounded-md bg-white/10 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <UserIcon className="h-4 w-4 text-blue-300" />
                  <span className="font-medium">{message.contactInfo.name}</span>
                </div>
                <div className="text-sm text-white/80">{message.contactInfo.role}</div>
                <div className="text-sm text-blue-300 mt-1">{message.contactInfo.email}</div>
              </div>
            )}
            
            {/* Warning message */}
            {message.warning && (
              <div className="mt-3 p-3 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-start gap-2">
                <AlertTriangleIcon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm text-white/90">{message.warning}</div>
              </div>
            )}
            
            {/* Interactive options */}
            {message.options && message.options.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {message.options.map(option => (
                  <Button
                    key={option.id}
                    variant="outline"
                    size="sm"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 transition-all"
                    onClick={() => onSelectOption(message.id, option.id)}
                  >
                    {option.icon === "check" && <CheckIcon className="mr-1 h-3 w-3" />}
                    {option.icon === "x" && <XIcon className="mr-1 h-3 w-3" />}
                    {option.icon === "info" && <InfoIcon className="mr-1 h-3 w-3" />}
                    {option.text}
                  </Button>
                ))}
              </div>
            )}
            
            {/* Timestamp */}
            <div
              className={cn(
                "text-xs mt-2 opacity-70",
                isUser ? "text-right" : "text-left"
              )}
            >
              <time dateTime={message.timestamp.toISOString()}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          </div>
        </div>
        
        {/* Children messages with connecting lines */}
        {message.children.length > 0 && (
          <div className="ml-8 pl-6 border-l-2 border-dashed border-red-500/60 mt-2">
            {message.children.map(child => renderMessage(child, true))}
          </div>
        )}
      </div>
    );
  };

  // Transform messages to include children array for tree structure
  const messagesWithChildren = messages.map(msg => ({ ...msg, children: [] }));
  const messageTree = buildMessageTree(messagesWithChildren);

  return (
    <ScrollArea className="h-[calc(100vh-220px)] md:h-[calc(100vh-200px)] pr-4">
      <div className="flex flex-col gap-8 pb-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full py-8">
            <p className="text-white/70 text-center">
              No messages yet. Start a conversation by uploading a screenshot or typing below.
            </p>
          </div>
        ) : (
          messageTree.map(message => renderMessage(message))
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
