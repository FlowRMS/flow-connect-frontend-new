'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { Button } from '@/components/flow-ai/ui/button';
import {
  ScanText,
  FileStack,
  Bot,
  Workflow,
  Upload,
  ArrowLeft,
  User,
  Shield,
  ListTodo,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/flow-ai/ui/dropdown-menu';
import { useWorkflowTenant } from '@/lib/flow-ai/workflow-tenant-context';
import { navigateToNewUpload } from '@/lib/flow-ai/navigation-utils';

export function WorkflowHeader() {
  const { isAdmin, setRole, role } = useWorkflowTenant();

  return (
    <header className="border-b bg-gradient-to-r from-card via-card to-primary/5 sticky top-0 z-30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 max-w-[90vw]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <NextImage
                src="/flow-logo.png"
                alt="FlowAI Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <h1 className="text-2xl font-bold">FlowAI</h1>
            </Link>

            <nav className="hidden md:flex items-center gap-2 ml-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToNewUpload}
                className="text-muted-foreground hover:text-foreground"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/flow-ai" className="text-muted-foreground hover:text-foreground">
                  <ScanText className="w-4 h-4 mr-2" />
                  FlowScan
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link
                  href="/flow-ai/templates"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <FileStack className="w-4 h-4 mr-2" />
                  Templates
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link
                  href="/flow-ai/ai-chat"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  FlowChat
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/flow-ai/workflows" className="text-foreground">
                  <Workflow className="w-4 h-4 mr-2" />
                  Workflows
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link
                  href="/flow-ai/queue"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ListTodo className="w-4 h-4 mr-2" />
                  Queue
                </Link>
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {isAdmin ? (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Mode
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      User Mode
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setRole('user')}
                  className={role === 'user' ? 'bg-accent' : ''}
                >
                  <User className="w-4 h-4 mr-2" />
                  User Mode
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setRole('admin')}
                  className={role === 'admin' ? 'bg-accent' : ''}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Mode
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  {isAdmin
                    ? 'Admin: Edit actual code'
                    : 'User: View pseudo code only'}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href =
                  process.env.NEXT_PUBLIC_FLOWRMS_APP_URL ||
                  'https://development.app.flowrms.com/';
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to FlowRMS
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}





