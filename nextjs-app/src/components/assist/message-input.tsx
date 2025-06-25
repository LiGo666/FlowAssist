"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendIcon, ImageIcon, MicIcon, PlusIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  isLoading?: boolean;
}

export function MessageInput({ onSendMessage, isLoading = false }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the textarea on component mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Auto-resize textarea based on content
  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(message.trim(), attachments);
      setMessage("");
      clearAttachments();
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setAttachments(prev => [...prev, ...newFiles]);
    
    // Create preview URLs for images
    const newPreviewUrls = newFiles.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return '';
    });
    
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleScreenshotClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const clearAttachments = () => {
    // Revoke all object URLs to avoid memory leaks
    previewUrls.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    setAttachments([]);
    setPreviewUrls([]);
  };

  const removeAttachment = (index: number) => {
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Screenshot upload button - prominent at the top */}
      <div className="flex justify-center">
        <Button 
          type="button" 
          onClick={handleScreenshotClick}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg px-6 py-6 h-auto rounded-xl transition-all"
          disabled={isLoading}
        >
          <ImageIcon className="h-6 w-6 mr-2" />
          Upload Screenshot
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </Button>
      </div>

      {/* Preview area for attachments */}
      {attachments.length > 0 && (
        <Card className="p-3 bg-white/10 backdrop-blur-sm border-white/20">
          <div className="text-sm font-medium mb-2 text-white/80">Attachments ({attachments.length})</div>
          <div className="flex flex-wrap gap-3">
            {attachments.map((file, index) => (
              <div key={index} className="relative group">
                <div className="w-24 h-24 rounded-md overflow-hidden border border-white/30 bg-black/20 flex items-center justify-center">
                  {previewUrls[index] ? (
                    <img 
                      src={previewUrls[index]} 
                      alt={`Preview ${index}`} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-white/50 text-xs text-center p-2">
                      {file.name.slice(0, 20)}{file.name.length > 20 ? '...' : ''}
                    </div>
                  )}
                </div>
                <button 
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove attachment"
                >
                  <PlusIcon className="h-3 w-3 rotate-45" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Message input form */}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onInput={handleInput}
              placeholder="Add a brief description or ask a question..."
              className="min-h-[50px] max-h-[200px] pr-12 resize-none bg-white/5 border-white/10 text-white placeholder:text-white/50 rounded-xl"
              disabled={isLoading}
              aria-label="Message input"
            />
            <div className="absolute bottom-2 right-2 flex space-x-1">
              <Button 
                type="button" 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" 
                disabled={isLoading} 
                aria-label="Voice input"
              >
                <MicIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button 
            type="submit" 
            size="icon" 
            disabled={(!message.trim() && attachments.length === 0) || isLoading} 
            aria-label="Send message"
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 w-10 rounded-full"
          >
            <SendIcon className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
