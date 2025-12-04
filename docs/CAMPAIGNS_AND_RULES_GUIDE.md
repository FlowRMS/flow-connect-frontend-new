# Campaigns & Rules User Guide

## What Is This Feature?

The **Email Flow** module (also called Campaigns & Rules) is your **automated email and communication center**. It helps you send emails to your contacts without manually doing it one-by-one. Think of it as your personal email assistant that can:

1. **Send bulk emails** to groups of contacts (Campaigns)
2. **Automatically send emails** when something happens in your CRM (Rules)

**Important:** Campaigns and Rules are **separate features** that work independently. You do NOT assign a rule to a campaign. They serve different purposes:
- **Campaigns** = One-time email blasts you manually create and send
- **Rules** = Ongoing automations that run in the background forever

---

## The Four Tabs Explained

### 📧 Tab 1: Campaigns

**What it shows:** A list of all your email campaigns (past, current, and scheduled).

**What you can see for each campaign:**
- **Campaign Name** - What you named this email blast
- **Subject** - The email subject line
- **Status** - Where it's at in the process:
  - `Draft` - Still being worked on, not sent yet
  - `Scheduled` - Set to send at a future date/time
  - `Sending` - Currently being sent out
  - `Completed` - All emails have been sent
- **Recipients** - How many people will receive this email
- **Progress** - For active campaigns, shows how many emails have been sent vs. total

**Actions you can take on each campaign:**
| Icon | Action | When Available |
|------|--------|----------------|
| ✏️ Edit | Modify the campaign | Draft only |
| 📋 Duplicate | Create a copy of this campaign | Always |
| ⏸️ Pause | Stop a scheduled or sending campaign | Scheduled/Sending |
| 📊 Stats | View open rates, click rates, etc. | Completed |
| 🗑️ Delete | Remove the campaign | Draft only |

**Real-world examples of campaigns:**
- "Q1 Product Launch" - Announcing new LED products to 45 customers
- "Trade Show Invitations" - Inviting 120 contacts to visit your booth at a convention
- "Year-End Follow-up" - Checking in with contacts who have active projects

---

### ➕ Tab 2: New Campaign

**What it does:** This is where you **create a new email campaign** to send to a group of contacts.

#### Step-by-Step What You Can Do:

**1. Name Your Campaign**
   - Give it a descriptive name like "Spring 2025 Product Announcement"

**2. Choose How to Select Recipients** (3 methods):

| Method | What It Means | Best For |
|--------|--------------|----------|
| **Static List** | You manually pick specific contacts one by one | Small, hand-picked lists where you know exactly who you want |
| **Criteria-Based** | Set rules to filter contacts (e.g., "All General Contractors in Texas") | When you want a specific type of contact |
| **Dynamic Rules** | Same as criteria, but the list **auto-updates daily** | Ongoing campaigns where new matching contacts should be included |

**3. Set Up Your Filters (for Criteria/Dynamic)**
   - Filter by **entity type**: Contact, Job, Company, Pre-Opportunity, or Quote
   - Filter by **fields**: Name, Email, Status, Tags, Territory, Dates, etc.
   - Combine filters with **AND/OR logic** (e.g., "GC type AND in California" or "EC type OR Architect type")

**4. Write Your Email**
   - **Subject line** - What appears in their inbox
   - **Email body** - Your actual message

**5. Optional AI Features**
   - **Generate with AI** - Let AI help write your email content
   - **AI Personalization** - Automatically customize each email for the specific recipient (their name, company, etc.)

**6. Control Send Speed**
   - **Fast** - 500 emails/hour
   - **Medium** - 200 emails/hour
   - **Slow** - 100 emails/hour
   - **Very Slow** - 50 emails/hour
   - **Randomized** - Mimics human-like sending patterns (looks more natural)

**7. Set Max Emails Per Day**
   - Limit how many emails go out daily (prevents overloading or looking like spam)

**8. Choose When to Send**
   - **Send Immediately** - Start sending as soon as you click "Create Campaign"
   - **Schedule for Later** - Pick a specific date and time for the campaign to start

**9. Preview & Test Before Sending**
   - **Preview Email** - See exactly what the email will look like
   - **Send Test Email** - Send a test copy to yourself first to make sure it looks right

**10. Final Actions**
   - **Create Campaign** - Start (or schedule) the campaign
   - **Save as Draft** - Save your work to finish later
   - **Cancel** - Discard and go back

---

### 🔄 Tab 3: Rules

**What it shows:** A list of all your automation rules.

**What you can see for each rule:**
- **Rule Name** - What you named this automation
- **Trigger** - What event causes this rule to fire
- **Status**:
  - `Active` - Currently running, will send emails when triggered
  - `Paused` - Temporarily stopped
  - `Draft` - Not activated yet
- **Emails Sent** - How many emails this rule has sent in total
- **Last Triggered** - When this rule last sent an email

**Actions you can take on each rule:**
| Icon | Action | When Available |
|------|--------|----------------|
| ▶️ Activate | Turn on a paused rule | Paused only |
| ⏸️ Pause | Temporarily stop the rule | Active only |
| ✏️ Edit | Modify the rule | Always |
| 📋 Duplicate | Create a copy of this rule | Always |
| 📊 Stats | View how the rule is performing | When emails have been sent |
| 🗑️ Delete | Remove the rule | Always |

**Real-world examples of rules:**
- **"New Contact Welcome Email"** - Automatically sends a welcome message whenever someone is added as a new contact
- **"Job Win Follow-up"** - When a job status changes to "Won", automatically send a congratulations email
- **"Inactive Contact Re-engagement"** - If a contact hasn't been active for 90+ days, send a "We miss you" email
- **"Birthday Greeting"** - Automatically send birthday wishes on a contact's birthday

---

### ➕ Tab 4: New Rule

**What it does:** This is where you **create automated email triggers** that send emails when specific events happen.

#### Step-by-Step What You Can Do:

**1. Name Your Rule**
   - Give it a descriptive name like "New Lead Welcome Sequence"

**2. Set Trigger Conditions**
   - Define **when** this email should be sent
   - Examples:
     - "When a Contact is added"
     - "When a Job status equals 'Won'"
     - "When a Quote is created"
     - "When a Contact has no activity for 90 days"
   - Combine multiple conditions with AND/OR logic

**3. Choose Communication Type**
   | Type | What Happens |
   |------|-------------|
   | **Email** | Sends an email to the contact |
   | **Notification** | Sends an internal notification (to your team) |
   | **Both** | Sends email + internal notification |

**4. Choose Audience**
   | Audience | Who Receives It |
   |----------|----------------|
   | **External** | Goes to customers/contacts outside your company |
   | **Internal** | Goes to your team members |

**5. Write Your Message**
   - Write the subject and body
   - Use **variables** that auto-fill:
     - `{name}` - Recipient's name
     - `{company}` - Their company name
     - `{email}` - Their email address
     - `{phone}` - Their phone number

**6. Optional AI Personalization**
   - Let AI customize each email to feel more personal

**7. Set Limits**
   - **Send Pace** - How fast to send (same options as campaigns)
   - **Max Emails Per Day** - Cap how many emails this rule can send daily (prevents spam accidents)

**8. Preview & Test Before Activating**
   - **Preview Email** - See exactly what the email will look like
   - **Send Test Email** - Send a test copy to yourself first

**9. Final Actions**
   - **Activate Rule** - Turn on the rule so it starts working
   - **Save as Draft** - Save your work to finish later
   - **Cancel** - Discard and go back

---

## Campaigns vs. Rules: What's the Difference?

| Aspect | Campaigns | Rules |
|--------|-----------|-------|
| **When it runs** | When you schedule or send it | Automatically when triggered |
| **Frequency** | One-time blast | Ongoing, fires every time conditions are met |
| **Use case** | Announcements, newsletters, promotions | Automated follow-ups, welcomes, reminders |
| **Control** | You decide exactly when | System decides based on trigger events |
| **Can be edited after starting?** | No (only drafts) | Yes, can pause and edit anytime |
| **Recipient list** | Fixed when created (unless Dynamic) | Determined per trigger event |

---

## Common Use Cases

### Campaigns - Use For:
- ✅ Product announcements to customers
- ✅ Event invitations (trade shows, webinars)
- ✅ Newsletters
- ✅ Seasonal promotions
- ✅ Project update blasts
- ✅ Year-end thank you messages

### Rules - Use For:
- ✅ Welcome emails for new contacts
- ✅ Follow-ups after winning a job
- ✅ Quote expiration reminders
- ✅ Re-engaging inactive contacts
- ✅ Birthday/anniversary messages
- ✅ Alerting your team when something important happens

---

## Workflow Example

### Scenario: You want to announce a new product AND welcome new contacts

**For the announcement (Campaign):**
1. Go to "New Campaign" tab
2. Name it "New LED Product Line Launch"
3. Choose "Criteria-Based" and filter for "Contact Type = EC" (Electrical Contractors)
4. Write your announcement email
5. Click "Preview Email" to check it looks good
6. Click "Send Test Email" to send yourself a copy
7. Schedule it for next Monday at 9 AM
8. Click "Create Campaign"

**For welcoming new contacts (Rule):**
1. Go to "New Rule" tab
2. Name it "New Contact Welcome"
3. Set trigger: "When Contact is added"
4. Choose "Email" and "External"
5. Write your welcome message using `Hi {name}` to personalize
6. Set Max Per Day to 50 (safety limit)
7. Click "Preview Email" and "Send Test Email"
8. Click "Activate Rule"

Now the campaign will go out on Monday, and anyone added as a new contact will automatically get a welcome email forever.

---

## Quick Tips

1. **Start with rules for the basics** - Welcome emails and win follow-ups are easy wins
2. **Use Dynamic lists** if your contact list changes frequently
3. **Set reasonable send limits** on rules to avoid sending too many emails
4. **Use AI personalization** to make mass emails feel personal
5. **Check the "Rules" tab regularly** to see which automations are working
6. **Always send a test email** before launching a campaign
7. **Use the Preview feature** to catch formatting issues
8. **Pause rules** if you need to make changes rather than deleting them

---

## Summary

| Tab | Purpose |
|-----|---------|
| **Campaigns** | View all your email blasts |
| **New Campaign** | Create a one-time email to a group |
| **Rules** | View all your automated email triggers |
| **New Rule** | Create an automatic email that fires on events |

The key difference: **Campaigns are for when YOU want to send emails. Rules are for when the SYSTEM should automatically send emails based on what happens in your CRM.**
