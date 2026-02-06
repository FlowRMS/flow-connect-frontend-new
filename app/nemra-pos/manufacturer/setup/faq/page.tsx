'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  FAQPageContainer,
  FAQSection,
  NEMRAStandardsNotice,
  type FAQSectionData,
} from '@/components/faq';
import {
  FileText,
  Shield,
  Building2,
  Package,
  DollarSign,
  TruckIcon,
  ClipboardList,
  BookOpen,
  Scissors,
  ArrowRight,
  Plus,
  Settings,
  HelpCircle,
} from 'lucide-react';

// ============================================================================
// FAQ Data for Manufacturer
// ============================================================================

function useManufacturerFAQSections(): FAQSectionData[] {
  return useMemo(() => [
    // Data Collection & Formatting
    {
      id: 'data-collection',
      icon: FileText,
      title: 'Data Collection & Formatting',
      description: 'What to expect from POS/POT data received from distributors',
      items: [
        {
          id: 'transaction-level',
          question: 'Should I expect aggregated or transaction-level data?',
          answer: (
            <>
              <p className="mb-3">
                <strong>Always expect transaction-level data, not aggregated data.</strong>
              </p>
              <p className="mb-3">
                All information from distributors should be at a transactional level, not an aggregated level. This allows for information to be specifically tracked and appropriately compensated, as you may compensate agents by product groups/categories differently and may incentivize them during specific periods.
              </p>
              <p>
                Coupled with end-user zip code information, transaction-level data enables you to audit ship/debit activity and compensate appropriately.
              </p>
            </>
          ),
        },
        {
          id: 'part-numbers',
          question: 'How should distributors format my part numbers?',
          answer: (
            <>
              <p className="mb-3">
                Distributors should provide your part number information in the exact format that you provide in your product/price files, <strong>without any appended prefixes</strong>.
              </p>
              <p className="mb-3">
                If hyphens or other characters are included in your part numbers and can be accommodated in their ERP system, they should be included.
              </p>
              <p className="mb-3">
                <strong>Tip:</strong> Whenever feasible, distributors should include a UPC number as a cross-reference to facilitate product identification.
              </p>
            </>
          ),
          featureCallout: {
            icon: Scissors,
            title: 'FlowConnect Automatic Prefix Removal',
            description: 'Many distributors add their own prefixes to part numbers in their ERP systems (e.g., "PSC-", "DIST_"). FlowConnect can automatically strip known distributor prefixes from incoming data before delivery to you. Configure known prefix patterns in the Validation settings.',
            linkHref: '/nemra-pos/manufacturer/setup/validation#customization',
            linkLabel: 'Configure Prefix Removal',
          },
        },
        {
          id: 'bulk-packaging',
          question: 'How should bulk packaging and units of measure be handled?',
          answer: (
            <>
              <p className="mb-3">
                NEMRA recommends that, depending upon your preferences, either:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>The UPC accounts for the bulk unit of measure as a unit of one, or</li>
                <li>This is managed on a one-on-one basis between you and the distributor, as distributors manage this differently based upon their internal systems</li>
              </ul>
            </>
          ),
        },
        {
          id: 'invoice-correlation',
          question: 'Can I require distributors to include my invoice numbers?',
          answer: (
            <>
              <p className="mb-3">
                Based on industry feedback, it is extremely difficult, and many times impossible, for a distributor to correlate their sales to specific supplier invoices.
              </p>
              <p className="mb-3">
                If you require this information, you should engage directly with individual distributors to request it or, if necessary, conduct audits.
              </p>
            </>
          ),
          featureCallout: {
            icon: Plus,
            title: 'FlowConnect Custom Fields',
            description: 'While invoice number is not part of the standard NEMRA requirements, FlowConnect supports custom fields. Distributors can include additional data beyond the standard 16 fields if you\'ve agreed upon this with them.',
            linkHref: '/nemra-pos/manufacturer/setup/mapping',
            linkLabel: 'View Field Configuration',
          },
        },
        {
          id: 'custom-fields',
          question: 'Can I receive custom fields beyond the NEMRA standard?',
          answer: (
            <>
              <p className="mb-3">
                <strong>Yes.</strong> FlowConnect supports custom fields beyond the 16 standard NEMRA POS fields. This is useful when:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>You&apos;ve requested additional data from specific distributors (e.g., invoice numbers, project codes)</li>
                <li>Distributors agree to include customer-level information for your account</li>
                <li>You need fields that aren&apos;t part of the NEMRA standard</li>
              </ul>
              <p className="mb-3">
                Custom fields are configured on a per-distributor basis. Each distributor may provide different additional fields based on your agreements with them.
              </p>
              <div className="p-3 bg-muted rounded-lg mb-4">
                <p className="text-sm">
                  <strong>Important:</strong> Custom fields are appended after the standard 16 NEMRA columns, per NEMRA recommendations. They do not replace or modify the standard fields.
                </p>
              </div>
            </>
          ),
          featureCallout: {
            icon: Plus,
            title: 'FlowConnect Custom Field Support',
            description: 'View which custom fields each distributor provides in the Field Coverage page. You can see exactly what data you\'re receiving from each source.',
            linkHref: '/nemra-pos/manufacturer/field-coverage',
            linkLabel: 'View Field Coverage',
          },
        },
        {
          id: 'additional-fields',
          question: 'How do I request additional information from distributors?',
          answer: (
            <>
              <p className="mb-3">
                If you desire additional information beyond the standard fields, you should engage directly with your distributors regarding this additional information. Examples include:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>Customer level information (name, SIC/NAICS, etc.)</li>
                <li>Customer industry segmentation</li>
                <li>Division sold through (datacom, utility, telco, etc.)</li>
                <li>Invoice or PO numbers</li>
                <li>Project or job codes</li>
              </ul>
              <p className="mb-3">
                Per NEMRA guidelines, this information should be recorded in columns beyond the 16 standard fields. As appropriate, the information should be shared with your manufacturer representatives to support sales efforts, in accordance with agreed-upon guidelines with the distributor.
              </p>
            </>
          ),
          featureCallout: {
            icon: Settings,
            title: 'FlowConnect Rep Visibility Controls',
            description: 'Control which fields your rep firms can see in the Mapping settings. You can configure field visibility on a per-rep-firm basis to ensure each rep only sees the data appropriate for their role.',
            linkHref: '/nemra-pos/manufacturer/setup/mapping',
            linkLabel: 'Configure Rep Visibility',
          },
        },
      ],
    },
    // Confidentiality & Data Sharing
    {
      id: 'confidentiality',
      icon: Shield,
      title: 'Confidentiality & Data Sharing',
      description: 'Guidelines for protecting sensitive information',
      items: [
        {
          id: 'confidentiality-agreement',
          question: 'Should I have confidentiality agreements with distributors?',
          answer: (
            <>
              <p className="mb-3">
                <strong>Yes.</strong> Manufacturers and distributors should execute a confidentiality agreement that covers point of sale/point of transfer information and identifies:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>The usages of the information</li>
                <li>Where, if anywhere, information can be transmitted to third parties</li>
                <li>What, if anything, can be shared externally</li>
              </ul>
            </>
          ),
          featureCallout: {
            icon: FileText,
            title: 'FlowConnect Agreement Management',
            description: 'FlowConnect allows you to upload and store your data sharing agreements for each distributor. Keep all your confidentiality agreements organized in one place.',
            linkHref: '/nemra-pos/manufacturer/distributors',
            linkLabel: 'Manage Distributor Agreements',
          },
        },
        {
          id: 'customer-info',
          question: 'Should I expect customer-specific information from distributors?',
          answer: (
            <>
              <p className="mb-3">
                <strong>Not by default.</strong> NEMRA encourages all parties to treat any information received and/or transferred in a confidential manner. In no instances is NEMRA advocating for customer-specific information to be shared unless expressly agreed upon by all parties.
              </p>
              <p className="mb-3">
                End-user/Purchaser Name and Address is <strong>not part of the minimum reporting standards</strong>. If agreed upon with a distributor, this information can be included in separate fields beyond the standard columns:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>End-user / Contractor Customer Name</li>
                <li>End-user / Contractor Address</li>
                <li>End-user / Contractor City</li>
                <li>End-user / Contractor Zip Code</li>
              </ul>
            </>
          ),
          featureCallout: {
            icon: Shield,
            title: 'FlowConnect Field Coverage',
            description: 'Use the Field Coverage page to see exactly which fields each distributor is providing. This helps you understand what data you\'re receiving and identify any gaps.',
            linkHref: '/nemra-pos/manufacturer/field-coverage',
            linkLabel: 'View Field Coverage',
          },
        },
        {
          id: 'place-of-purchase',
          question: 'What is "Place of Purchase" vs "Point of Sale"?',
          answer: (
            <>
              <p className="mb-3">
                While the industry commonly uses the term &quot;Point of Sale&quot; (POS), NEMRA suggests that <strong>&quot;Place of Purchase&quot;</strong> is actually a more accurate term for what&apos;s being reported.
              </p>
              <p className="mb-3">
                NEMRA defines &quot;Place of Purchase&quot; as either:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li><strong>The distributor branch ZIP code</strong> (where the sale originated), OR</li>
                <li><strong>The customer&apos;s ZIP code</strong> (where the product was delivered/used)</li>
              </ul>
              <p className="mb-3">
                This means that detailed end-user contact information (company name, full address) is <strong>not required</strong> to be transferred between distributors and manufacturers. Only a ZIP code is needed to establish the &quot;place&quot; of the transaction for territory assignment and compensation purposes.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Validation Note:</strong> At least one ZIP code (either Selling Branch ZIP or Customer ZIP) is required per NEMRA standards. Distributors don&apos;t need to provide both—one is sufficient to establish the place of purchase.
                </p>
              </div>
            </>
          ),
        },
      ],
    },
    // Lot Orders & Direct Ships
    {
      id: 'lot-orders',
      icon: TruckIcon,
      title: 'Lot Orders & Direct Ships',
      description: 'Handling large project orders and direct shipments',
      items: [
        {
          id: 'lot-orders-handling',
          question: 'How should lot orders be handled?',
          answer: (
            <>
              <p className="mb-3">
                <strong>NEMRA recommends that you manage &quot;lot orders&quot; through your direct ship process and compensate accordingly.</strong>
              </p>
              <p className="mb-3">
                Lot orders (large project-based orders, direct-ship orders) should not be blindly paid via standard POS commission calculations. They require separate audit handling for rep compensation.
              </p>
            </>
          ),
          featureCallout: {
            icon: TruckIcon,
            title: 'FlowConnect Lot Order Detection',
            description: 'FlowConnect automatically flags orders with Order Type of LOT, DIRECT_SHIP, PROJECT, or SPECIAL in incoming data. These are marked for your review and not auto-processed for standard commission calculations.',
            linkHref: '/nemra-pos/manufacturer/setup/validation',
            linkLabel: 'View Validation Rules',
          },
        },
        {
          id: 'direct-ships',
          question: 'Are direct shipments included in POS reporting?',
          answer: (
            <>
              <p className="mb-3">
                <strong>Yes.</strong> Point of Sale information includes shipments directly from you (the manufacturer) to the end-customer (Direct Ships), as well as shipments from a distributor&apos;s branch and/or central/regional distribution center to the end-customer.
              </p>
              <p className="mb-3">
                <strong>Important:</strong> It is <strong>your responsibility</strong> as the manufacturer to include direct ship data in POS reporting to reps. Direct ship orders originate from your own systems, so this data must be merged with distributor-provided POS data to give reps complete visibility into all compensable sales.
              </p>
              <p className="mb-4">
                Ensure that you are compensating manufacturer representatives for direct shipments as well as stock and flow business. Representatives have shared instances where a manufacturer inadvertently reports stock sales but not direct shipments, resulting in lost compensation.
              </p>
            </>
          ),
          featureCallout: {
            icon: TruckIcon,
            title: 'FlowConnect Direct Ship Reporting',
            description: 'You can upload your direct ship data to FlowConnect to merge with distributor POS data. This ensures your reps have complete visibility into all sales activity in their territory.',
            linkHref: '/nemra-pos/manufacturer/setup/data-intake-method',
            linkLabel: 'Configure Data Sources',
          },
        },
      ],
    },
    // Pricing & Compensation
    {
      id: 'pricing',
      icon: DollarSign,
      title: 'Pricing & Compensation',
      description: 'Cost calculations and commission handling',
      items: [
        {
          id: 'distributor-cost',
          question: 'What cost should distributors report - with or without rebates?',
          answer: (
            <>
              <p className="mb-3">
                Distributors should report the <strong>Distributor Unit Cost</strong> as it appears in their ERP system.
              </p>
              <p className="mb-3">
                <strong>You are responsible</strong> for removing any rebates or additional deducts that may impact agent compensation.
              </p>
              <p>
                It is your responsibility (unless otherwise agreed upon) to calculate a Distributor Net Cost upon which to compensate your agent. The rationale is that the definition of &quot;net&quot; may vary in the areas of sales tax, freight, service fees, etc., and this can change by product/product category.
              </p>
            </>
          ),
        },
        {
          id: 'extended-price',
          question: 'How is Extended/Total Price calculated?',
          answer: (
            <>
              <p>
                <strong>Extended Net Price</strong> (or Total Price) is defined as the distributor net cost multiplied by the quantity (number of units sold).
              </p>
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="font-mono text-sm">Extended Price = Distributor Unit Cost × Quantity</p>
              </div>
            </>
          ),
        },
        {
          id: 'private-label',
          question: 'How are private label/no label sales handled?',
          answer: (
            <>
              <p className="mb-3">
                You and your manufacturer representatives should clarify if the representative should be compensated for private label/no label sales in their territory and to specific distributors.
              </p>
              <p>
                This should also be considered for POS/POT reporting as private label products may be shipped into/out of the territory via a Central/Regional Distribution Center.
              </p>
            </>
          ),
        },
      ],
    },
    // POS vs POT Reporting
    {
      id: 'pos-pot',
      icon: Building2,
      title: 'POS vs POT Reporting',
      description: 'Understanding the difference between Point of Sale and Point of Transfer',
      items: [
        {
          id: 'pos-definition',
          question: 'What is Point of Sale (POS)?',
          answer: (
            <>
              <p className="mb-3">
                <strong>Point of Sale (POS)</strong> is information about the end-customer transaction. It includes:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Shipments directly from you (the manufacturer) to the end-customer (Direct Ships)</li>
                <li>Shipments from a distributor&apos;s branch to the end-customer</li>
                <li>Shipments from a distributor&apos;s central/regional distribution center (CDC/RDC) to the end-customer</li>
              </ul>
            </>
          ),
        },
        {
          id: 'pot-definition',
          question: 'What is Point of Transfer (POT)?',
          answer: (
            <>
              <p className="mb-3">
                <strong>Point of Transfer (POT)</strong> is information about the transfer of product within a distributor&apos;s organization. It includes:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>Shipments between a distributor&apos;s central/regional distribution center (CDC or RDC) and a branch</li>
                <li>Transfers of inventory between branches</li>
              </ul>
              <p>
                POT can be used for sales credit purposes and for marketing trend analysis.
              </p>
            </>
          ),
        },
        {
          id: 'pot-relevance',
          question: 'Do all distributors need to report POT data?',
          answer: (
            <>
              <p className="mb-3">
                Distributors with only one location, or whose branches receive shipments directly from manufacturers rather than from a regional distribution center, may not see the same need as other distributors to collect POT data.
              </p>
              <p>
                The collection of POT data is not relevant to such distributors. However, they may still share POS data for marketing and/or sales purposes.
              </p>
            </>
          ),
        },
      ],
    },
    // Commodity Products
    {
      id: 'commodity',
      icon: Package,
      title: 'Commodity Products',
      description: 'Handling products that are difficult to track by supplier',
      items: [
        {
          id: 'commodity-definition',
          question: 'What is a commodity product?',
          answer: (
            <>
              <p className="mb-3">
                A <strong>commodity product</strong> is electrical material which is commonly placed/inventoried in the same location by a distributor regardless of which supplier they may have purchased the material from, making it virtually impossible to determine which supplier&apos;s material is sold via the distributor&apos;s ERP system.
              </p>
              <p className="mb-3">
                Examples include certain types of wire, pipe, conduit, and other commonly defined materials.
              </p>
              <p>
                <strong>Note:</strong> These NEMRA standards focus on non-commodity products. Non-commodity products are those with a specific UPC, a specific part number, and are commonly inventoried by distributors in unique inventory locations where it is easily determined which manufacturer&apos;s product was sold.
              </p>
            </>
          ),
        },
        {
          id: 'commodity-tracking',
          question: 'Can distributors track commodity products?',
          answer: (
            <p>
              Whenever feasible, it is desired for distributors to identify which supplier&apos;s material is sold to specific customers, even for commodity products. However, NEMRA recognizes this is not always possible due to ERP system limitations.
            </p>
          ),
        },
      ],
    },
    // ZIP Codes & Locations
    {
      id: 'zip-codes',
      icon: ClipboardList,
      title: 'ZIP Codes & Locations',
      description: 'Understanding location information in POS data',
      items: [
        {
          id: 'customer-zip',
          question: 'What ZIP code should distributors use for customers?',
          answer: (
            <>
              <p className="mb-3">The Customer Zip Code depends on the type of customer:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>For contractors:</strong> If material is picked-up/delivered, use their zip code. When material is &quot;drop shipped,&quot; ideally use the zip code of where the material is shipped.
                </li>
                <li>
                  <strong>For industrial end-users, OEMs, and institutional customers:</strong> Use the zip code of the end-user facility/where the material will be used. Use the physical address zip code rather than a &quot;bill-to&quot; address, as some accounts have invoices billed to corporate accounts/locations.
                </li>
                <li>
                  <strong>For CDC/RDC deliveries:</strong> Use the zip code of delivery locations for deliveries made directly from a distributor&apos;s CDC/RDC to a &quot;customer&quot; location.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: 'selling-branch-zip',
          question: 'What is the Selling Branch ZIP Code?',
          answer: (
            <p>
              For POS reporting, the <strong>Selling Branch Zip Code</strong> is the zip code of the branch that sold the material to the customer.
            </p>
          ),
        },
      ],
    },
    // Getting Help
    {
      id: 'getting-help',
      icon: HelpCircle,
      title: 'Getting Help',
      description: 'Resources and contacts for additional assistance',
      items: [
        {
          id: 'nemra-contact',
          question: 'Who can I contact for questions about NEMRA standards?',
          answer: (
            <>
              <p className="mb-3">
                If you have recommendations or suggestions to improve these standards, contact:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>David Gordon, NEMRA POS/POT Task Force Facilitator and President of Channel Marketing Group: dgordon@channelmkt.com</li>
                <li>Jim Johnson, NEMRA: jjohnson@nemra.org</li>
                <li>NEMRA website: www.nemra.org</li>
              </ul>
            </>
          ),
        },
        {
          id: 'agreements',
          question: 'Where can I find guidance on manufacturer/rep agreements?',
          answer: (
            <>
              <p className="mb-3">
                NEMRA has updated its &quot;Guidelines for Negotiating Agreements Between Sales Representatives and Manufacturers&quot; to include guidance on POS/POT compensation and reporting responsibilities.
              </p>
              <p>
                Contact NEMRA at www.nemra.org to obtain a copy.
              </p>
            </>
          ),
        },
      ],
    },
  ], []);
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ManufacturerFAQPage() {
  const sections = useManufacturerFAQSections();

  return (
    <FAQPageContainer
      title="Frequently Asked Questions"
      subtitle="Best practices and guidance from NEMRA POS/POT standards"
      standardsNotice={<NEMRAStandardsNotice icon={BookOpen} />}
      sections={sections}
    />
  );
}
