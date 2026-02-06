'use client';

import { useMemo } from 'react';
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
  Plus,
  Settings,
  HelpCircle,
} from 'lucide-react';

// ============================================================================
// FAQ Data for Distributor
// ============================================================================

function useDistributorFAQSections(): FAQSectionData[] {
  return useMemo(() => [
    // Data Collection & Formatting
    {
      id: 'data-collection',
      icon: FileText,
      title: 'Data Collection & Formatting',
      description: 'How to properly format and submit POS/POT data',
      items: [
        {
          id: 'transaction-level',
          question: 'Should I submit aggregated or transaction-level data?',
          answer: (
            <>
              <p className="mb-3">
                <strong>Always submit transaction-level data, not aggregated data.</strong>
              </p>
              <p className="mb-3">
                All information from distributors should be at a transactional level, not an aggregated level. This allows for information to be specifically tracked and appropriately compensated, as manufacturers may compensate agents by product groups/categories differently and may incentivize them during specific periods.
              </p>
              <p>
                Coupled with end-user zip code information, transaction-level data enables manufacturers to audit ship/debit activity and compensate appropriately.
              </p>
            </>
          ),
        },
        {
          id: 'part-numbers',
          question: 'How should I format manufacturer part numbers?',
          answer: (
            <>
              <p className="mb-3">
                Provide manufacturers with the manufacturer&apos;s part number information in the exact format that the manufacturer provides in their product/price files, <strong>without any appended prefixes</strong>.
              </p>
              <p className="mb-3">
                If hyphens or other characters are included in the manufacturer part number and can be accommodated in your ERP system, they should be included.
              </p>
              <p className="mb-3">
                <strong>Tip:</strong> Whenever feasible, include a UPC number as a cross-reference to facilitate manufacturer research in identifying products.
              </p>
            </>
          ),
          featureCallout: {
            icon: Scissors,
            title: 'FlowConnect Automatic Prefix Removal',
            description: 'If your ERP system automatically adds prefixes to manufacturer part numbers (e.g., "PSC-", "DIST_"), FlowConnect can automatically strip these before sending data to manufacturers. Simply configure your prefix patterns in the Validation settings.',
            linkHref: '/nemra-pos/distributor/setup/validation#customization',
            linkLabel: 'Configure Prefix Removal',
          },
        },
        {
          id: 'bulk-packaging',
          question: 'How should I handle bulk packaging and units of measure?',
          answer: (
            <>
              <p className="mb-3">
                NEMRA recommends that, depending upon the manufacturer, either:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>The UPC accounts for the bulk unit of measure as a unit of one, or</li>
                <li>This is managed on a one-on-one basis between the manufacturer and the distributor, as distributors manage this differently based upon their internal systems</li>
              </ul>
            </>
          ),
        },
        {
          id: 'invoice-correlation',
          question: 'Do I need to include the manufacturer\'s invoice number?',
          answer: (
            <>
              <p className="mb-3">
                Based on industry feedback, it is extremely difficult, and many times impossible, for a distributor to correlate their sales to specific supplier invoices.
              </p>
              <p className="mb-3">
                This level of request is left to manufacturers interacting individually with their distributor(s) to request the information or, if necessary, conducting audits.
              </p>
            </>
          ),
          featureCallout: {
            icon: Plus,
            title: 'FlowConnect Custom Fields',
            description: 'While invoice number is not part of the standard NEMRA requirements, FlowConnect allows you to add custom fields if a specific manufacturer requests this information.',
            linkHref: '/nemra-pos/distributor/setup/mapping',
            linkLabel: 'Add Custom Fields',
          },
        },
        {
          id: 'custom-fields',
          question: 'Can I add custom fields beyond the NEMRA standard?',
          answer: (
            <>
              <p className="mb-3">
                <strong>Yes.</strong> FlowConnect allows you to add custom fields beyond the 16 standard NEMRA POS fields. This is useful when:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>A specific manufacturer requests additional data (e.g., invoice numbers, project codes)</li>
                <li>You want to include customer-level information for certain manufacturers</li>
                <li>You need manufacturer-specific fields that aren&apos;t part of the NEMRA standard</li>
              </ul>
              <p className="mb-3">
                Custom fields can be configured globally (sent to all manufacturers) or on a per-manufacturer basis. This flexibility allows you to meet individual manufacturer requirements while maintaining the standard format for others.
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
            title: 'FlowConnect Custom Field Configuration',
            description: 'Add custom fields in the Mapping settings. You can specify which manufacturers receive each custom field, allowing different configurations for different manufacturer requirements.',
            linkHref: '/nemra-pos/distributor/setup/mapping',
            linkLabel: 'Add Custom Fields',
          },
        },
        {
          id: 'additional-fields',
          question: 'What if a manufacturer requests additional information beyond the standard fields?',
          answer: (
            <>
              <p className="mb-3">
                Manufacturers who desire additional information from a distributor should engage directly with their distributors regarding this additional information. Examples include:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>Customer level information (name, SIC/NAICS, etc.)</li>
                <li>Customer industry segmentation</li>
                <li>Division sold through (datacom, utility, telco, etc.)</li>
                <li>Invoice or PO numbers</li>
                <li>Project or job codes</li>
              </ul>
              <p className="mb-3">
                Per NEMRA guidelines, this information should be recorded in columns beyond the 16 standard fields. As appropriate, the information should be shared with the manufacturer representative to support sales efforts, in accordance with agreed-upon guidelines with the distributor.
              </p>
            </>
          ),
          featureCallout: {
            icon: Settings,
            title: 'FlowConnect Per-Manufacturer Configuration',
            description: 'Configure custom fields for specific manufacturers in the Mapping settings. You can also control field visibility per manufacturer in the Routing settings to ensure each manufacturer only receives the data they\'ve agreed to receive.',
            linkHref: '/nemra-pos/distributor/setup/mapping',
            linkLabel: 'Field Mapping',
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
          question: 'Should I have a confidentiality agreement in place?',
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
            description: 'FlowConnect allows you to upload and store your data sharing agreements for each manufacturer. Keep all your confidentiality agreements organized in one place.',
            linkHref: '/nemra-pos/distributor/manufacturers',
            linkLabel: 'Manage Manufacturer Agreements',
          },
        },
        {
          id: 'customer-info',
          question: 'Am I required to share customer-specific information?',
          answer: (
            <>
              <p className="mb-3">
                <strong>No.</strong> NEMRA encourages all parties to treat any information received and/or transferred in a confidential manner. In no instances is NEMRA advocating for customer-specific information to be shared unless expressly agreed upon by all parties.
              </p>
              <p className="mb-3">
                End-user/Purchaser Name and Address is <strong>not part of the minimum reporting standards</strong>. If agreed upon by the distributor and the manufacturer, this information can be included to the right of the standardized columns in separate fields:
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
            title: 'FlowConnect Field Visibility Controls',
            description: 'FlowConnect gives you granular control over which fields are shared with each manufacturer. You can hide or show specific fields on a per-manufacturer basis, ensuring you only share what\'s been agreed upon.',
            linkHref: '/nemra-pos/distributor/setup/routing',
            linkLabel: 'Configure Field Visibility',
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
                  <strong>Validation Note:</strong> At least one ZIP code (either Selling Branch ZIP or Customer ZIP) is required per NEMRA standards. You don&apos;t need to provide both—one is sufficient to establish the place of purchase.
                </p>
              </div>
            </>
          ),
          featureCallout: {
            icon: ClipboardList,
            title: 'FlowConnect ZIP Code Validation',
            description: 'FlowConnect enforces this rule automatically: if you map one ZIP code field, the other becomes optional. See the linked fields indicator on the Mapping page.',
            linkHref: '/nemra-pos/distributor/setup/mapping',
            linkLabel: 'Configure ZIP Code Mapping',
          },
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
                <strong>NEMRA recommends that manufacturers manage &quot;lot orders&quot; through their direct ship process and compensate accordingly.</strong>
              </p>
              <p className="mb-3">
                Lot orders (large project-based orders, direct-ship orders) should not be blindly paid via standard POS commission calculations. They require separate audit handling for rep compensation.
              </p>
            </>
          ),
          featureCallout: {
            icon: TruckIcon,
            title: 'FlowConnect Lot Order Support',
            description: 'FlowConnect allows you to flag lot orders using the Order Type field. Map this field from your ERP system, and FlowConnect will automatically flag lot orders for manufacturer review.',
            linkHref: '/nemra-pos/distributor/setup/mapping',
            linkLabel: 'Configure Lot Order Fields',
          },
        },
        {
          id: 'direct-ships',
          question: 'Are direct shipments included in POS reporting?',
          answer: (
            <>
              <p className="mb-3">
                <strong>Yes.</strong> Point of Sale information includes shipments directly from the manufacturer to the end-customer (Direct Ships), as well as shipments from a distributor&apos;s branch and/or central/regional distribution center to the end-customer.
              </p>
              <p className="mb-3">
                <strong>Important:</strong> It is the <strong>manufacturer&apos;s responsibility</strong> to include direct ship data in their POS reporting to reps. Direct ship orders originate from the manufacturer&apos;s own systems, so this data must be merged with distributor-provided POS data to give reps complete visibility into all compensable sales.
              </p>
              <p className="mb-4">
                Manufacturers should ensure that they are compensating manufacturer representatives for direct shipments as well as stock and flow business. Representatives have shared instances where a manufacturer inadvertently reports stock sales but not direct shipments, resulting in lost compensation.
              </p>
            </>
          ),
          featureCallout: {
            icon: TruckIcon,
            title: 'FlowConnect Direct Ship Reporting',
            description: 'Manufacturers can configure FlowConnect to include direct ship data in rep POS reports. This ensures reps have complete visibility into all sales activity in their territory.',
            linkHref: '#',
            linkLabel: 'Configure Direct Ship Reporting',
            disabled: true,
            disabledMessage: 'This setting is only available to manufacturer accounts.',
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
          question: 'What cost should I report - with or without rebates?',
          answer: (
            <>
              <p className="mb-3">
                Report the <strong>Distributor Unit Cost</strong> as it appears in your ERP system.
              </p>
              <p className="mb-3">
                The manufacturer is responsible for removing any rebates or additional deducts that may impact agent compensation.
              </p>
              <p>
                It is the manufacturer&apos;s responsibility (unless otherwise agreed upon) to calculate a Distributor Net Cost upon which to compensate their agent. The rationale is that the definition of &quot;net&quot; may vary amongst manufacturers in the areas of sales tax, freight, service fees, etc., and this can change by product/product category.
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
                Manufacturer representatives and manufacturers should clarify if the manufacturer representative should be compensated for private label/no label sales in their territory and to specific distributors.
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
                <li>Shipments directly from the manufacturer to the end-customer (Direct Ships)</li>
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
                <strong>Point of Transfer (POT)</strong> is information about the transfer of product within a company. It includes:
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
          question: 'Does my company need to report POT data?',
          answer: (
            <>
              <p className="mb-3">
                Distributors with only one location, or whose branches receive shipments directly from manufacturers rather than from a regional distribution center, may not see the same need as other distributors to collect POT data.
              </p>
              <p>
                The collection of POT data is not relevant to such distributors. However, they may still see value in sharing POS data for marketing and/or sales purposes.
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
          question: 'Should I still try to track commodity products?',
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
      description: 'Properly reporting location information',
      items: [
        {
          id: 'customer-zip',
          question: 'What ZIP code should I use for the customer?',
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
                Manufacturers and manufacturer representatives should contact NEMRA at www.nemra.org to obtain a copy.
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

export default function DistributorFAQPage() {
  const sections = useDistributorFAQSections();

  return (
    <FAQPageContainer
      title="Frequently Asked Questions"
      subtitle="Best practices and guidance from NEMRA POS/POT standards"
      standardsNotice={<NEMRAStandardsNotice icon={BookOpen} />}
      sections={sections}
    />
  );
}
