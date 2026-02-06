'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Building2,
  Factory,
  Briefcase,
  ArrowRight,
  Upload,
  Download,
  BarChart3,
  Shield,
  Check,
} from 'lucide-react';

export default function NemraPosV2Home() {
  const personas = [
    {
      role: 'distributor',
      label: 'Distributor',
      icon: Building2,
      description: 'Send POS data to manufacturers',
      features: [
        'Upload POS/POT data via file, integration, or email',
        'AI-powered validation against NEMRA standard',
        'Configure data permissions per manufacturer',
        'Track delivery history and notes',
      ],
      color: 'bg-blue-100 text-blue-600',
    },
    {
      role: 'manufacturer',
      label: 'Manufacturer',
      icon: Factory,
      description: 'Receive and distribute POS data',
      features: [
        'Configure intake format and column mappings',
        'Manage distributor connections',
        'Set up rep territories and data routing',
        'View dashboards and analytics',
      ],
      color: 'bg-purple-100 text-purple-600',
    },
    {
      role: 'rep',
      label: 'Rep Firm',
      icon: Briefcase,
      description: 'View POS data from manufacturers',
      features: [
        'See which manufacturers are reporting',
        'View and export POS data',
        'Nudge manufacturers to join',
        'Stream data directly to Flow',
      ],
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold mb-3">FlowConnect POS V2</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Simplified POS data sharing for the electrical industry.
          Send, receive, and analyze NEMRA-standard POS data.
        </p>
      </div>

      {/* Persona Cards */}
      <div className="grid grid-cols-3 gap-6">
        {personas.map((persona) => {
          const Icon = persona.icon;
          return (
            <Card key={persona.role} className="flex flex-col">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${persona.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <CardTitle>{persona.label}</CardTitle>
                <CardDescription>{persona.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 flex-1 mb-4">
                  {persona.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`/nemra-pos/${persona.role}`} className="w-full">
                  <Button className="w-full">
                    Enter as {persona.label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-4 gap-4 pt-8">
        <Card>
          <CardContent className="pt-6">
            <Upload className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Easy Upload</h3>
            <p className="text-sm text-muted-foreground">
              Upload via file, API integration, or scheduled email
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Shield className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">AI Validation</h3>
            <p className="text-sm text-muted-foreground">
              Automatic validation against NEMRA POS/POT standards
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Download className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Flexible Export</h3>
            <p className="text-sm text-muted-foreground">
              Download or stream directly to Flow CRM
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <BarChart3 className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Dashboards</h3>
            <p className="text-sm text-muted-foreground">
              Analytics and reporting built-in
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
