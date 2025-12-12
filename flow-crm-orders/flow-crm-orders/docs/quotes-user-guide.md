# FlowConnect Quotes Module - User Guide

Welcome to the FlowConnect Quotes module! This comprehensive guide will walk you through all the features available to help you create, manage, and track quotes for your projects.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Quote List Views](#quote-list-views)
3. [Creating and Managing Quotes](#creating-and-managing-quotes)
4. [Quote Detail View](#quote-detail-view)
5. [Line Item Management](#line-item-management)
6. [Multi-Manufacturer Support](#multi-manufacturer-support)
7. [Pricing and Overage](#pricing-and-overage)
8. [Manufacturer Approvals](#manufacturer-approvals)
9. [Recipients and Sending Quotes](#recipients-and-sending-quotes)
10. [Distributor-Specific Quotes](#distributor-specific-quotes)
11. [Version History](#version-history)
12. [Notes and Activity](#notes-and-activity)
13. [Tips and Best Practices](#tips-and-best-practices)

---

## Getting Started

To access the Quotes module, click **Quotes** in the left sidebar navigation. You'll see all your quotes organized by stage in either Kanban or List view.

### Quick Overview

Each quote displays key information at a glance:
- **Quote ID and Name** - Unique identifier and descriptive name
- **Bill-To Customer** - The distributor receiving the quote
- **Sold-To Customer** - The builder/contractor for the project
- **Value** - Total quote amount
- **Win Probability** - Likelihood of winning the quote (hover for details)
- **Approval Status** - Whether manufacturer approvals are complete
- **Expiration Date** - When the quote expires (highlighted red if within 7 days)

---

## Quote List Views

### Kanban View

The default view organizes quotes into columns by stage:

| Stage | Description |
|-------|-------------|
| **Draft** | Quotes being prepared |
| **Review** | Internal review in progress |
| **Sent** | Delivered to customer |
| **Negotiating** | Active discussions with customer |
| **Won** | Successfully closed quotes |
| **Lost** | Quotes that weren't won |

**Drag and drop** quotes between columns to update their stage.

### List View

Click the list icon in the toolbar to switch to a tabular view with sortable columns. This view is ideal for:
- Sorting quotes by value, expiration, or win probability
- Bulk selecting quotes for actions
- Seeing more quotes at once

### Filtering Quotes

Use the **Advanced Filters** button to filter by:
- Quote ID or Name
- Stage
- Bill-To or Sold-To Customer
- Value range
- Owner
- Approval Status (All / Clear / Pending / Blocked)

---

## Creating and Managing Quotes

### Creating a New Quote

1. Click the **+ New Quote** button in the top right
2. Fill in the required information:
   - Quote name
   - Bill-To customer (distributor)
   - Sold-To customer (builder/contractor)
   - Associated job
   - Expiration date
3. Click **Create** to generate the quote

### Pipeline Statistics

At the top of the quotes list, you'll see:
- **Pipeline** - Total value of active quotes
- **Won YTD** - Total value of quotes won this year

---

## Quote Detail View

Click any quote card to open the detail view. The detail view has several sections:

### Header Bar

- **Quote ID and Name** - Click to edit
- **Stage Dropdown** - Change the quote stage
- **Win Probability Badge** - Hover to see factors affecting win likelihood
- **Approval Status** - Shows pending approvals count
- **Expiration Date** - Highlighted if expiring soon

### Action Buttons

- **Edit Quote** - Modify quote details
- **Generate Distributor Quotes** - Create distributor-specific versions
- **Send Quote** - Send to recipients (disabled if approvals pending)

### Tabs

Navigate between different sections:
- **Line Items** - Products and pricing
- **Approvals** - Manufacturer approval status
- **Recipients** - Who will receive the quote
- **Distributor Quotes** - Distributor-specific versions
- **History** - Version history
- **Notes** - Internal notes and activity

### Right Sidebar

The sidebar shows:
- **Pricing Summary** - Base total, sell price, overage, commission
- **Price Levels** - L1, L2, L3 totals with recipient mapping
- **Approval Status** - Quick view of manufacturer statuses
- **Quote Details** - Expiration, owner, last updated, version

---

## Line Item Management

### Viewing Line Items

Line items are organized into **sections** (e.g., "Interior Lighting", "Controls"). Each section can be collapsed or expanded by clicking the header.

### Line Item Columns

| Column | Description |
|--------|-------------|
| **Part #** | Product number/SKU |
| **Description** | Product description |
| **Qty** | Quantity ordered |
| **Mfr** | Manufacturer (shows approval status icon) |
| **Base** | Base/cost price (when overage is shown) |
| **Sell** | Sell price to customer |
| **Over%** | Overage percentage (when enabled) |
| **L1/L2** | Level 1 and Level 2 pricing |
| **Trend** | Price history sparkline |

### Adding Line Items

1. Click **+ Add Line** in the toolbar
2. Enter product details
3. Select manufacturer and pricing
4. Assign to a section

### Adding Sections

1. Click **+ Add Section**
2. Enter section name (e.g., "Lobby Lighting")
3. Drag line items into the section

### Show/Hide Overage

Toggle **Show Overage** in the toolbar to display or hide the Base price and Overage % columns.

### Bulk Actions

Select multiple line items using checkboxes, then use **Bulk Actions** to:
- **Set % Overage** - Apply overage to selected lines
- **Copy Sell → L1/L2/L3** - Copy sell price with markup
- **Move to Section** - Reorganize lines
- **Lock/Unlock Prices** - Prevent price changes
- **Mark as Approved** - Bulk approve manufacturers
- **Request Approval** - Generate approval requests
- **Delete Selected** - Remove lines

### Price Lookup

Click the magnifying glass icon next to any line item's sparkline to open the **Price Lookup** modal, which shows:
- Manufacturer and approval status
- Commission bands with rates
- Current band indicator
- Overage eligibility per band

---

## Multi-Manufacturer Support

Some line items may have multiple manufacturer options. These are indicated by showing "X Mfrs" in the manufacturer column.

### Expanding Multi-Manufacturer Lines

Click any line item row to expand and see all manufacturers. The expanded view shows:
- Each manufacturer's base price
- Commission rate
- Overage share percentage
- Approval status with date
- Actions (Request Approval, Edit)

### Adding Manufacturers

In the expanded view, click **+ Add Manufacturer** to add an alternative manufacturer option to a line item.

---

## Pricing and Overage

### Understanding Price Levels

| Level | Typical Use | Default Markup |
|-------|-------------|----------------|
| **Sell** | Distributor pricing | Base price |
| **Level 1** | Standard contractor | +10% |
| **Level 2** | Preferred contractor | +15% |
| **Level 3** | List price | +20% |

### Copy Price Modal

When using bulk actions to copy prices:
1. Select target level (L1, L2, or L3)
2. Enter markup percentage
3. Choose to apply to selected lines or all lines
4. Preview the new totals
5. Click **Apply**

Note: Locked lines will be skipped.

### Overage Calculation

Overage is the profit margin above base price:
- **Overage Amount** = Sell Price - Base Price
- **Overage %** = (Overage Amount / Base Price) × 100

Commission is calculated based on:
- Base commission rate on the base price
- Overage share percentage on the overage amount

### Sparkline Price History

Each line item shows a mini chart of historical pricing. **Hover** over the sparkline to see:
- Larger chart visualization
- 12-month price change and percentage
- Min, Max, and Average prices
- Current price

---

## Manufacturer Approvals

### Understanding Approval Status

| Status | Icon | Meaning |
|--------|------|---------|
| **Approved** | Green checkmark | Manufacturer approved for this builder |
| **Conditional** | Yellow clock | Approved with conditions (specific products only) |
| **Not Approved** | Red X | Not on approved list, needs approval request |
| **Unknown** | Gray ? | No approval data available |

### Approvals Tab

The Approvals tab shows three sections:

1. **Approved** - Manufacturers fully approved for the builder
2. **Needs Review** - Conditional approvals or pending requests
3. **Not Approved** - Manufacturers requiring approval requests

### Requesting Approval

1. Click **Request Approval** for a not-approved manufacturer
2. Fill in the Approval Request form:
   - Builder and project info (auto-filled)
   - Select products/SKUs to include
   - Write justification explaining why this manufacturer is needed
   - Attach supporting documents (spec sheets, comparisons)
   - Select contact to send to
3. Click **Preview PDF** to review the request
4. Click **Send Request** to submit

### Marking Approval Status

When you receive an approval response:
1. Find the pending request in the Approvals tab
2. Click **Mark as Approved** dropdown
3. Select status: Approved, Approved with Conditions, or Rejected
4. Enter conditions (if applicable)
5. Add approver name and date
6. Upload proof document (email, letter)
7. Optionally save to builder's approved list for future quotes

### Win Probability Impact

Approval status affects win probability:
- All approved: +5% to probability
- Pending approvals: No change
- Rejected manufacturers: -15% to probability

---

## Recipients and Sending Quotes

### Recipients Tab

Manage who receives your quote:

| Field | Description |
|-------|-------------|
| **Company** | Recipient organization |
| **Contact** | Person receiving the quote |
| **Email** | Email address |
| **Level** | Price level they receive (Sell, L1, L2, L3) |
| **Sent** | Date quote was sent |

### Adding Recipients

1. Click **+ Add Recipient**
2. Select company and contact
3. Choose price level
4. Save

### Sending Quotes

1. Select recipients using checkboxes
2. Click **Send to Selected**
3. Review the send confirmation
4. Click **Send**

**Important:** If any manufacturers are not approved, you'll see a warning banner. Resolve approvals before sending to avoid issues.

### Send History

Below the recipients table, view the history of all quote sends including:
- Date and time
- Recipient
- Price level sent
- Status (Delivered, Opened, etc.)

---

## Distributor-Specific Quotes

Generate customized quotes for different distributors with appropriate pricing based on their manufacturer relationships.

### Generating Distributor Quotes

1. Click **Generate Distributor Quotes** button
2. Select distributors from the list
3. View their authorized manufacturer count and pricing category
4. Click **Generate Quotes**

### Distributor Quotes Tab

View all generated distributor quotes with:
- Distributor name and domain
- Status (Draft, Requires Cross, Ready to Send, Sent)
- Original vs. Discounted totals
- Discount percentage
- Lines approved vs. total

### Understanding Status

| Status | Meaning |
|--------|---------|
| **Draft** | Quote generated but not reviewed |
| **Requires Cross** | Some lines need cross-reference alternatives |
| **Ready to Send** | All lines resolved, ready for distributor |
| **Sent** | Quote delivered to distributor |

### Distributor Quote Detail

Click **View Details** on any distributor quote to see:

**Summary Cards:**
- Original Total
- Discounted Total
- Total Savings (amount and percentage)
- Line Status (approved/total)

**Cross-Reference Alert:**
If lines require cross-reference, you'll see a warning with the count of affected lines.

**Line Items Table:**
- SKU (original or crossed)
- Manufacturer
- Price Category (Stocking, Buy-Sell, Non-Stocking)
- Original and Discounted prices
- Status

**Pricing Audit Log:**
Track all pricing decisions and cross-references applied.

### Resolving Cross-References

When a distributor doesn't carry a manufacturer:
1. Click **Resolve Crosses** on the distributor quote
2. Review suggested alternatives
3. Accept AI suggestions or manually select alternatives
4. Approve changes

---

## Version History

### History Tab

Track all changes to your quote:

**Version List:**
- Version number with "current" indicator
- Date and user who made changes
- Summary of what changed
- Approval status at that version
- Quote value at that version

### Comparing Versions

1. Select two versions using radio buttons
2. Click **Compare Versions**
3. View side-by-side comparison of changes

### Creating Revisions

Click **Create Revision** to:
1. Save current state as a new version
2. Make changes to the quote
3. Track modifications over time

---

## Notes and Activity

### Notes Tab

The Notes tab shows a timeline of all activity:

**Activity Types:**
- Approval status updates
- Manual notes added
- Approval requests sent
- Quotes sent to recipients
- Version created

### Adding Notes

1. Click the text area at the top
2. Type your note
3. Click **Add Note**

Notes are timestamped and attributed to the user who added them.

---

## Tips and Best Practices

### Workflow Recommendations

1. **Start with approvals** - Check manufacturer approval status early
2. **Use sections** - Organize line items logically for easier review
3. **Lock critical prices** - Prevent accidental changes to negotiated prices
4. **Track versions** - Create revisions before major changes
5. **Add notes** - Document important conversations and decisions

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Click row | Expand/collapse line item |
| Checkbox + Bulk Actions | Multi-select operations |

### Common Workflows

**Preparing a New Quote:**
1. Create quote with customer details
2. Add sections and line items
3. Check manufacturer approvals
4. Request any needed approvals
5. Set pricing levels
6. Add recipients
7. Send quote

**Handling Approval Requests:**
1. Navigate to Approvals tab
2. Review not-approved manufacturers
3. Click Request Approval
4. Fill in justification and attach documents
5. Send to builder contact
6. Mark status when response received

**Generating Distributor Quotes:**
1. Complete main quote pricing
2. Click Generate Distributor Quotes
3. Select relevant distributors
4. Review each distributor quote
5. Resolve any cross-references
6. Send to distributors

---

## Getting Help

If you need assistance:
- Contact your system administrator
- Check the FlowConnect knowledge base
- Submit a support ticket through the Help menu

---

*This guide covers FlowConnect Quotes Module v1.0*
