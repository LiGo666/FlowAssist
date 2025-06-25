"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronRightIcon, UserIcon } from "lucide-react";

export type UserContext = {
  name: string;
  role: string;
  department: string;
  technicalFamiliarity: string;
  communicationStyle: string;
  avatarUrl?: string;
};

interface UserContextPanelProps {
  userContext: UserContext;
}

export function UserContextPanel({ userContext }: UserContextPanelProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/10 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <UserIcon className="h-4 w-4 mr-2" />
          User Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-white/20">
            <AvatarImage src={userContext.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"} />
            <AvatarFallback>{userContext.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{userContext.name}</div>
            <div className="text-sm text-gray-300">{userContext.role}</div>
          </div>
        </div>
        
        <Separator className="bg-white/10" />
        
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-300">Department:</span>
            <span className="ml-2">{userContext.department}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-300">Technical Familiarity:</span>
            <span className="ml-2">{userContext.technicalFamiliarity}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-300">Communication Style:</span>
            <span className="ml-2">{userContext.communicationStyle}</span>
          </div>
        </div>
        
        <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
          Edit Context
          <ChevronRightIcon className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
