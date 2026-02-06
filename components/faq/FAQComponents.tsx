'use client';

import React, { useMemo, useCallback, ReactNode } from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

// ============================================================================
// Types
// ============================================================================

export interface FAQFeatureCallout {
    icon: LucideIcon;
    title: string;
    description: string;
    linkHref?: string;
    linkLabel?: string;
    disabled?: boolean;
    disabledMessage?: string;
}

export interface FAQItemData {
    id: string;
    question: string;
    answer: ReactNode;
    featureCallout?: FAQFeatureCallout;
}

export interface FAQSectionData {
    id: string;
    icon: LucideIcon;
    title: string;
    description: string;
    items: FAQItemData[];
}

// ============================================================================
// Feature Callout Component
// ============================================================================

interface FeatureCalloutProps {
    callout: FAQFeatureCallout;
}

export function FeatureCallout({ callout }: FeatureCalloutProps) {
    const Icon = callout.icon;

    return (
        <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-medium text-foreground mb-2">{callout.title}</p>
                    <p className="text-sm mb-3">{callout.description}</p>
                    {callout.linkHref && callout.linkLabel && (
                        <Button
                            variant="outline"
                            size="sm"
                            asChild={!callout.disabled}
                            disabled={callout.disabled}
                            className={callout.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            {callout.disabled ? (
                                <span>
                                    {callout.linkLabel}
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </span>
                            ) : (
                                <Link href={callout.linkHref}>
                                    {callout.linkLabel}
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                            )}
                        </Button>
                    )}
                    {callout.disabled && callout.disabledMessage && (
                        <p className="text-xs text-muted-foreground mt-2">{callout.disabledMessage}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// FAQ Item Component
// ============================================================================

interface FAQItemProps {
    item: FAQItemData;
}

export function FAQItemComponent({ item }: FAQItemProps) {
    return (
        <AccordionItem value={item.id} id={item.id}>
            <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
                {item.answer}
                {item.featureCallout && <FeatureCallout callout={item.featureCallout} />}
            </AccordionContent>
        </AccordionItem>
    );
}

// ============================================================================
// FAQ Section Component
// ============================================================================

interface FAQSectionProps {
    section: FAQSectionData;
}

export function FAQSection({ section }: FAQSectionProps) {
    const Icon = section.icon;

    // Memoize section items for performance
    const renderedItems = useMemo(
        () => section.items.map((item) => <FAQItemComponent key={item.id} item={item} />),
        [section.items]
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full">
                    {renderedItems}
                </Accordion>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// FAQ Page Container Component
// ============================================================================

interface FAQPageContainerProps {
    title: string;
    subtitle: string;
    standardsNotice: ReactNode;
    sections: FAQSectionData[];
}

export function FAQPageContainer({ title, subtitle, standardsNotice, sections }: FAQPageContainerProps) {
    // Memoize rendered sections for performance
    const renderedSections = useMemo(
        () => sections.map((section) => <FAQSection key={section.id} section={section} />),
        [sections]
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-muted-foreground">{subtitle}</p>
            </div>

            {standardsNotice}

            {renderedSections}
        </div>
    );
}

// ============================================================================
// NEMRA Standards Notice Component
// ============================================================================

interface NEMRAStandardsNoticeProps {
    icon: LucideIcon;
}

export function NEMRAStandardsNotice({ icon: Icon }: NEMRAStandardsNoticeProps) {
    return (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-primary" />
                <p className="font-medium">NEMRA Recommended Standards</p>
            </div>
            <p className="text-sm text-muted-foreground">
                These FAQs are based on the NEMRA / NMG Task Force recommended minimum POS/POT standards, updated January 2024. These guidelines facilitate reporting between distributors and manufacturers and ensure accurate, timely, and complete remuneration of manufacturer sales agents.
            </p>
        </div>
    );
}
