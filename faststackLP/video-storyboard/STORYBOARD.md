# FastStack Spend Promo Video Storyboard

**Status:** Review draft. Do not render final video until approved and final MP3 voice-over is provided.

**Format:** 1920 x 1080 landscape  
**Target duration:** 115-125 seconds after MP3 timing is received  
**Source footage:** Real FastStack web app footage from https://comeback2000.github.io/faststack/  
**Visual style:** Modern SaaS product launch video, clean white interface, dark navy app sidebar, teal accent, restrained shadows, clear typography  
**Audio plan:** Third-party MP3 voice-over supplied by client, subtle background music under VO, soft UI transition SFX

## Layout Guardrails

These rules fix the current text overflow issue and must be enforced before final rendering.

- Canvas safe area: 96 px on all sides. No text, cards, controls, or callouts may extend outside this safe area.
- Scene grid: 12-column layout with 40 px gutters.
- Left copy panel: 520 px wide minimum, 600 px maximum, 48 px internal padding.
- Product screen area: 1050-1180 px wide, centered vertically, never cropped through important UI labels.
- Headline max width: 430 px inside the copy panel.
- Headline max lines: 2 lines preferred, 3 lines maximum.
- Headline font: 52-64 px depending on copy length, dynamic fit if text exceeds width.
- Body text max width: 420 px, 2-3 lines maximum, 30-34 px line height.
- Footer labels inside panel: 18-20 px, never closer than 32 px to the card edge.
- Avoid handwritten arrows over UI unless there is enough empty space; use clean callout pins, outline pulses, and zoom highlights instead.
- Every scene must pass a visual overflow check at 0%, 50%, and 90% of scene duration.

## Visual System

**Background:** Soft off-white `#f6f8fb` with a very light blurred duplicate of the active screen at 12-18% opacity.  
**Primary card:** White `#ffffff`, 24 px radius, 1 px `#dce4ec`, soft shadow.  
**Accent:** FastStack teal `#0f766e` and dark teal `#115e59`.  
**Text:** Navy `#0f172a` for headings, slate `#475569` for body copy.  
**Screen frame:** Dark navy device frame, 22-28 px radius, real app screenshot/video inside with no stretched text.  
**Motion:** Smooth push-ins, spotlight pulses, row highlights, callout pins, and velocity-matched blur transitions.

## Voice-Over Script

Use this script for the third-party voice-over unless edits are requested before recording.

FastStack Spend is a secure expense management system for teams that need control without messy spreadsheets.

Start with protected login, so only authorized users can access project cash, expenses, reports, and backup tools.

The dashboard gives a clear view of total projects, cash in, cash out, net balance, recent transactions, and top project balances.

Create and manage separate projects or groups for tours, petty cash, office expenses, client visits, and custom budgets.

When money comes in, record a cash in transaction and allocate it to the correct project or expense group.

When spending happens, add a cash out expense with description, amount, project, date, time, and notes.

FastStack keeps the running balance updated automatically, so every project shows what was received, what was spent, and what remains.

Need to correct a record? Edit transactions after they are created, and the dashboard, reports, and balances update with the latest numbers.

Use the transactions page to review weekly activity, filter by project or type, and search through cash in and cash out records.

Generate clean PDF reports for sharing, approval, and record keeping.

Analytics help you understand spending trends, compare project activity, and monitor budgets before problems grow.

FastStack stores data through a secure Google Sheets backend API, so the sheet stays protected while your data remains centralized.

Daily Google Drive backups protect users, projects, groups, transactions, balances, settings, and restore points.

FastStack Spend is built for petty cash, project budgets, tour expense management, consultants, agencies, and growing teams.

Try FastStack today, or buy the white label license to rebrand it with your own company name, logo, colors, and domain.

## Scene Breakdown

| Scene | Timing Draft | Live Screen | On-Screen Text | Voice-Over Cue | Motion / Transition |
| --- | ---: | --- | --- | --- | --- |
| 1 | 0:00-0:08 | Login and app reveal | Secure expense control for every project | FastStack Spend is a secure expense management system... | Fade from white, logo settles, login screen slides into app dashboard. |
| 2 | 0:08-0:16 | Login / account security | Protected login. Authorized access only. | Start with protected login... | Lock icon pulse, login panel zoom, transition through sidebar. |
| 3 | 0:16-0:27 | Dashboard | Dashboard Overview | The dashboard gives a clear view... | Stats count up, dashboard cards glow one by one, slow screen push-in. |
| 4 | 0:27-0:36 | Projects page | Projects, tours, petty cash, office funds | Create and manage separate projects... | Project rows cascade in, balance bars draw left to right. |
| 5 | 0:36-0:45 | Cash In form | Cash In Transactions | When money comes in... | Form panel zoom, Allocate To field highlighted, cash-in amount pulse. |
| 6 | 0:45-0:54 | Expense / Cash Out form | Cash Out Expense Tracking | When spending happens... | Expense tab switch highlight, date/time fields callout, submit button pulse. |
| 7 | 0:54-1:03 | Group balance / dashboard | Real-Time Balance Tracking | FastStack keeps the running balance... | Balance card zoom, cash in and cash out numbers connect to net balance. |
| 8 | 1:03-1:12 | Edit transaction | Edit Any Transaction | Need to correct a record?... | Edit icon click simulation, form fields outline, balance recalculation badge. |
| 9 | 1:12-1:22 | Transactions page | Weekly Ledger | Use the transactions page... | Filter controls slide in, table rows scroll subtly, search field highlight. |
| 10 | 1:22-1:31 | Reports page | PDF Reports | Generate clean PDF reports... | PDF button lift, report table locks into printable layout. |
| 11 | 1:31-1:41 | Analytics page | Spending Trends & Analytics | Analytics help you understand... | Bar and donut chart highlights, project spending bars animate. |
| 12 | 1:41-1:50 | Google Sheets settings | Secure Google Sheets Backend | FastStack stores data through... | Backend API badge appears, sheet icon behind secure shield. |
| 13 | 1:50-1:59 | Backup & restore | Daily Google Drive Backups | Daily Google Drive backups protect... | Backup Now button pulse, retention card highlight, restore row outline. |
| 14 | 1:59-2:08 | Dashboard + CTA | Try FastStack or Buy White Label | FastStack Spend is built for... Try FastStack today... | Final hero composition, CTA buttons slide in, logo and URL hold. |

## Scene Details

### Scene 1 - Opening Hook

**Layout:** Full-width product screen on right, left card with logo and short headline.  
**On-screen text:** Secure expense control for every project  
**Visual:** Login screen appears first, then a smooth push-through reveals the dashboard. The transition suggests moving from protected access into the working app.  
**Animation:** Logo fades in, lock icon pulse, screen frame scales from 0.96 to 1.0.  
**Transition out:** Soft blur-through into login/security close-up.

### Scene 2 - Login & Security

**Layout:** Login screen large and centered with smaller callout chips on the right.  
**On-screen text:** Protected login. Authorized access only.  
**Callouts:** Secure login, verified users, account controls.  
**Animation:** Lock icon glows once, email/password fields receive a clean teal outline, then the dashboard sidebar slides in.  
**Transition out:** Sidebar becomes the visual bridge into dashboard.

### Scene 3 - Dashboard Overview

**Layout:** Product screen occupies 60% of width, copy panel occupies 28%, balanced with 96 px safe margins.  
**On-screen text:** Dashboard Overview  
**Callouts:** Total Projects, Total Cash In, Total Cash Out, Net Balance.  
**Animation:** Stat cards count up sequentially. Recent transactions list slides up 12 px. Top project balance bars fill.  
**Transition out:** Camera pans right toward the Projects nav item.

### Scene 4 - Project & Group Management

**Layout:** Projects table fills the screen frame; left copy panel uses two-line title only.  
**On-screen text:** Multi-Project Budget Management  
**Callouts:** Delhi Tour, Trading, status, balance.  
**Animation:** Rows cascade in with 90 ms stagger. Balance bars animate from zero. Active status pills pop softly.  
**Transition out:** Selected project row becomes a teal wipe into cash-in form.

### Scene 5 - Cash In Transactions

**Layout:** Form screen on right, left panel title limited to 2 lines. No arrow scribble. Use numbered callout dots instead.  
**On-screen text:** Cash In Transactions  
**Callouts:** Source, Amount, Allocate To, Date & Time.  
**Animation:** Form fields highlight in the order the VO mentions them. Amount field gets a short glow. Allocate To dropdown callout slides from right.  
**Transition out:** Form tab switch morphs from Cash In to Expense.

### Scene 6 - Expense / Cash Out Tracking

**Layout:** Expense form close-up; table preview stays below but muted.  
**On-screen text:** Cash Out Expense Tracking  
**Callouts:** Description, Amount, Project, Date, Time, Notes.  
**Animation:** Expense tab receives teal underline. Description and amount fields highlight. Add Expense button lifts 4 px and settles.  
**Transition out:** Cash-out amount travels as a small red token toward balance scene.

### Scene 7 - Real-Time Balance Tracking

**Layout:** Dashboard/group summary screen with balance cards large enough to read.  
**On-screen text:** Real-Time Balance Tracking  
**Callouts:** Cash In, Cash Out, Remaining Balance.  
**Animation:** Cash-in token and cash-out token feed into balance card. Balance counter updates with tabular numbers.  
**Transition out:** Balance card becomes an edit transaction panel.

### Scene 8 - Edit Any Transaction

**Layout:** Edit form and transaction row side by side inside screen frame.  
**On-screen text:** Edit Any Transaction  
**Callouts:** Amount, description, project, date, time.  
**Animation:** Edit icon clicks, row expands into form, fields receive tidy outline states. Recalculated balance badge appears.  
**Transition out:** Table row collapses into transaction ledger.

### Scene 9 - Weekly Transaction Ledger

**Layout:** Transactions page wide view. Copy panel is shorter and aligned top-left.  
**On-screen text:** Weekly Ledger  
**Callouts:** Project filter, type filter, week selector, search, edit action.  
**Animation:** Filters slide down in sequence. Table rows scroll 24 px. One Cash In and one Cash Out row highlight.  
**Transition out:** Report icon in sidebar pulses, then camera pans.

### Scene 10 - PDF Reports

**Layout:** Reports page with summary cards and transaction table.  
**On-screen text:** PDF Report Export  
**Callouts:** Cash In, Cash Out, Net Balance, Download PDF.  
**Animation:** Summary cards lift in stagger. PDF button glows. A paper sheet outline draws behind the report table.  
**Transition out:** Report table dissolves into analytics chart grid.

### Scene 11 - Analytics

**Layout:** Analytics page centered, chart area not cropped.  
**On-screen text:** Spending Trends & Analytics  
**Callouts:** Cash in vs cash out, top categories, project-wise spending.  
**Animation:** Bar chart grows from baseline. Donut chart arc draws clockwise. Project spending bars fill with labels locked inside the chart area.  
**Transition out:** Chart grid folds into Google Sheets backend scene.

### Scene 12 - Google Sheets Backend

**Layout:** Settings / Google Sheets state with secure backend concept overlay.  
**On-screen text:** Secure Google Sheets Backend  
**Callouts:** Private API, centralized data, no direct sheet exposure.  
**Animation:** Sheet icon appears behind a shield, then a line connects app UI to backend badge.  
**Transition out:** Shield morphs into Drive backup cloud.

### Scene 13 - Backup & Restore

**Layout:** Backup panel visible and readable, not cropped below fold.  
**On-screen text:** Daily Google Drive Backups  
**Callouts:** Daily at 2:15 AM IST, 30 days, Restore.  
**Animation:** Backup Now button pulse. Schedule, retention, and storage cards highlight one by one. Restore row outline appears.  
**Transition out:** White flash into final CTA.

### Scene 14 - Final CTA

**Layout:** Clean SaaS hero frame. Product screen on right, CTA panel on left.  
**On-screen text:** Try FastStack Spend. Buy White Label License - $100.  
**CTA buttons:** Launch FastStack, Buy White Label License.  
**Animation:** Logo enters first, CTA buttons slide in from below, final URL and email hold for 3 seconds.  
**Transition out:** Fade to white with logo hold.

## Required Sync After MP3

After the MP3 is provided:

1. Transcribe the MP3 to word-level timestamps.
2. Replace draft timings with exact narration timestamps.
3. Align scene transitions to sentence boundaries.
4. Align callout highlights to specific spoken phrases.
5. Keep CTA hold at the end for at least 3 seconds.
6. Run visual overflow inspection before final render.
7. Render final MP4 only after storyboard approval.

## Approval Checklist

- [ ] Scene order approved
- [ ] Voice-over script approved
- [ ] On-screen text approved
- [ ] Visual layout direction approved
- [ ] CTA wording approved
- [ ] Third-party MP3 provided
- [ ] Final render authorized
