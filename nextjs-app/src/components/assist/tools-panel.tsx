"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WrenchIcon, DatabaseIcon, BookOpenIcon, InfoIcon } from "lucide-react";

export type Tool = {
  id: string;
  name: string;
  description: string;
  icon: "wrench" | "database" | "book" | "info";
  active?: boolean;
};

interface ToolsPanelProps {
  tools: Tool[];
  onSelectTool: (toolId: string) => void;
}

export function ToolsPanel({ tools, onSelectTool }: ToolsPanelProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "wrench":
        return <WrenchIcon className="h-4 w-4" />;
      case "database":
        return <DatabaseIcon className="h-4 w-4" />;
      case "book":
        return <BookOpenIcon className="h-4 w-4" />;
      case "info":
      default:
        return <InfoIcon className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/10 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <WrenchIcon className="h-4 w-4 mr-2" />
          Available Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-300">
          Select tools to assist with your query:
        </div>
        
        <Separator className="bg-white/10" />
        
        <div className="space-y-2">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={tool.active ? "default" : "outline"}
              size="sm"
              className={`w-full justify-start ${
                tool.active 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "border-white/20 text-white hover:bg-white/10"
              }`}
              onClick={() => onSelectTool(tool.id)}
            >
              <span className="mr-2">{getIcon(tool.icon)}</span>
              {tool.name}
            </Button>
          ))}
        </div>
        
        <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
          Auto Select
        </Button>
      </CardContent>
    </Card>
  );
}
