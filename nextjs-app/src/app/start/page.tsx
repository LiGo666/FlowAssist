"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useState } from "react";

export default function StartPage() {
  const [activeProject, setActiveProject] = useState<number | null>(null);
  
  const handleProjectClick = (projectId: number) => {
    setActiveProject(projectId);
  };
  return (
    <div className="min-h-screen relative" style={{ 
      backgroundColor: "rgb(18, 43, 84)",
      backgroundImage: `radial-gradient(rgba(220, 220, 220, 0.2) 1px, transparent 1px)`,
      backgroundSize: "20px 20px"
    }}>
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-white">Start Page</h1>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="link" className="text-white/70 p-0 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="flex justify-between space-x-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">About this page</h4>
                    <p className="text-sm">
                      This is your workspace with a dark blue background (RGB 18, 43, 84) and a light grey dot grid pattern.
                      It features various shadcn UI components for a modern interface.
                    </p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20 border-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                  New Project
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Create New Project</SheetTitle>
                  <SheetDescription>
                    Fill in the details to create a new project in your workspace.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="name" className="text-right text-sm font-medium">
                      Name
                    </label>
                    <input id="name" className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="description" className="text-right text-sm font-medium">
                      Description
                    </label>
                    <textarea id="description" className="col-span-3 flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button type="submit">Create Project</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <Link href="/">
              <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20 border-white/20">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white/10 border-white/10 text-white backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription className="text-gray-200">Welcome to your workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-200">
                This is your personal workspace. Use this area to organize your projects and tasks.
                The background features a dark blue color (RGB 18, 43, 84) with a light grey dot grid pattern.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">Cancel</Button>
              <Button className="bg-white text-[rgb(18,43,84)] hover:bg-white/90">Create Project</Button>
            </CardFooter>
          </Card>
          
          <div className="col-span-2">
            <Card className="h-full bg-white/10 border-white/10 text-white backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Workspace Panel</CardTitle>
                <CardDescription className="text-gray-200">Your recent activities and projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div 
                      key={item} 
                      className={`p-4 rounded-lg border transition-all ${activeProject === item ? 'bg-white/15 border-white/30' : 'bg-white/5 border-white/10'}`}
                      onClick={() => handleProjectClick(item)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-white/20">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=Project%20${item}`} alt={`Project ${item}`} />
                            <AvatarFallback>P{item}</AvatarFallback>
                          </Avatar>
                          <h3 className="font-medium">Project {item}</h3>
                        </div>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Active</span>
                      </div>
                      <p className="text-sm text-gray-300 mt-2">
                        Last updated: June {20 + item}, 2025
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                              View
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="right">
                            <SheetHeader>
                              <SheetTitle>Project {item} Details</SheetTitle>
                              <SheetDescription>
                                View and manage project details
                              </SheetDescription>
                            </SheetHeader>
                            <div className="py-6">
                              <div className="flex items-center gap-4 mb-6">
                                <Avatar className="h-12 w-12 border border-gray-200">
                                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=Project%20${item}`} alt={`Project ${item}`} />
                                  <AvatarFallback>P{item}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-medium text-lg">Project {item}</h3>
                                  <p className="text-sm text-gray-500">Created on June {15 + item}, 2025</p>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Description</h4>
                                  <p className="text-sm text-gray-500">This is a sample project description for Project {item}. It contains all the details and goals for this specific project.</p>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Team Members</h4>
                                  <div className="flex -space-x-2">
                                    {[1, 2, 3].map((member) => (
                                      <Avatar key={member} className="h-8 w-8 border-2 border-background">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item * 10 + member}`} />
                                        <AvatarFallback>U{member}</AvatarFallback>
                                      </Avatar>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Status</h4>
                                  <div className="flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                                    <span className="text-sm">Active</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <SheetFooter>
                              <SheetClose asChild>
                                <Button variant="outline">Close</Button>
                              </SheetClose>
                              <Button>Edit Project</Button>
                            </SheetFooter>
                          </SheetContent>
                        </Sheet>
                        <Button size="sm" className="bg-white text-[rgb(18,43,84)] hover:bg-white/90">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-white/10 hover:bg-white/20 border-white/20">
                  View All Projects
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
