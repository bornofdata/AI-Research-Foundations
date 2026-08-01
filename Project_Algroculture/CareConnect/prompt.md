Here is the ultimate, master-level **Design Brief & Prompt** that merges all the rich context, edge cases, accessibility guidelines, and structural requirements into a single, cohesive document.

You can copy and paste everything below directly to your UI/UX designer or design agency.

---

# 📋 UI/UX Design Brief: Patient Portal Mobile Application

## 1. Executive Summary & Core Objective

We are building a comprehensive, cross-platform mobile application (iOS & Android) that enables patients to manage their complete relationship with their healthcare provider.

* **Core Mission:** Reduce patient anxiety, eliminate administrative confusion, and create a secure, direct channel for doctor-patient communication.
* **Emotional Tone:** Calm, empathetic, trustworthy, and clear. Think of the reliability of a top-tier modern banking app combined with the warmth of a quality healthcare clinic—never cold/clinical, and never consumer/flashy.

---

## 2. Target Audience & Accessibility Standards

* **User Demographics:** Adults aged 18 to 80+, including patients with low digital literacy, elderly users, and patients managing chronic conditions under high stress.
* **Compliance:** **WCAG 2.1 AA (Minimum)** visual and structural standards.
* **Accessibility Requirements:**
* Minimum tap target size: **48 × 48 dp/pt**.
* High contrast ratios for all text and UI elements.
* Native support for **Dynamic Type (iOS)** and **Font Scaling (Android)** without breaking layouts.
* Clear screen-reader labels (VoiceOver/TalkBack) for every interactive element.
* **No gesture-only interactions** (e.g., swipe-to-delete must have an explicit button alternative for older users).



---

## 3. Core Features & Screen Breakdown

### A. Dashboard / Home Screen

* **Next Appointment Card:** Date, time, doctor name, clinic address/telehealth link, and a 1-tap "Get Directions" or "Join Call" button.
* **Action Center / Quick Shortcuts:** Booking, Messaging, Test Results, Bill Pay, Rx Refill.
* **Summary Modules:** Unread message badges, recent lab results alert, and pending balance summaries.

### B. Appointment Scheduling & Management

* **Search & Filter:** Find providers by specialty, location, availability, and telehealth vs. in-person.
* **Booking Flow:** Calendar view, time-slot selection, prep instructions (e.g., "Fast 8 hours prior"), and confirmation with native calendar export (`.ics`).
* **Management:** Clear options to view, reschedule, or cancel existing appointments.

### C. Secure Doctor-Patient Messaging

* **Triage / Expectations:** Pre-message prompt setting expectations (e.g., *"Not for emergencies. Average doctor response time: 24–48 hours"*).
* **Category Tagging:** Option to tag thread by topic (Routine, Prescription, Test Follow-up).
* **Rich Messaging:** Support for text, photo attachments (e.g., rash/wound photos), PDFs, and voice notes. Include sent/read receipts.

### D. Test Results & Diagnostic Records

* **Overview List:** Chronological feed of lab work, imaging reports, and diagnostics.
* **Detail View:**
* Simple visual range indicators (e.g., standard reference range vs. user score) rather than raw numbers alone.
* **Plain-Language Summaries** paired with raw clinical data.
* Dedicated section for **Doctor’s Interpretation Notes**.
* **Trend Over Time:** Line graphs tracking recurring metrics (e.g., Glucose, A1C, Blood Pressure) across multiple test dates.



### E. Medications & Prescriptions

* **Active Rx Feed:** Medication name, dosage, schedule visual, prescribing doctor, and remaining refills.
* **Actions:** One-tap "Request Refill" flow and explicit interaction/allergy warning banners where relevant.

### F. Billing, Payments & Insurance

* **Account Overview:** Current balance, breakdown by service, and payment due dates.
* **Payment Flow:** Flexible options (Apple Pay, Google Pay, Credit Card, ACH) with support for **Payment Plan** setups.
* **Documentation:** Downloadable itemized statements and Explanation of Benefits (EOB).

### G. Profile, Settings & Multi-User Support

* **Account Switching:** Seamless mechanism for parents or caregivers managing **dependents or elderly family members** from a single login.
* **Privacy & Security:** Biometric authentication (FaceID/Fingerprint), session timeout cues, and Protected Health Information (PHI) visibility indicators (*"Only visible to you and your care team"*).

---

## 4. Information Architecture & Navigation Request

* **Primary Navigation:** We propose a **5-Item Bottom Tab Bar**:
1. 🏠 **Home** (Dashboard)
2. 📅 **Appointments**
3. 💬 **Messages**
4. 📋 **Health Records** (Test Results & Medications)
5. 💳 **Billing & Profile**


* *Designer Note:* If you recommend an alternative layout (e.g., hamburger menu or hybrid structure), please document your UX rationale.

---

## 5. Non-Negotiable Edge Cases & Constraints

1. **Design for Interruption:** Ensure forms (like booking or messaging) auto-save drafts so users do not lose data if backgrounded mid-task.
2. **Panic-Free Alerts:** Avoid aggressive red alert badges for routine notifications. Reserve strong alert styling strictly for urgent items (e.g., critical test flags or past-due accounts).
3. **Empty & Error States:** Design clean, helpful states for:
* No upcoming appointments
* No lab results available yet
* Offline / Poor connectivity banner
* Payment failure dialog



---

## 6. Deliverables Required

1. **User Flow Diagrams:** Visual flows for the 3 primary tasks: Booking an appointment, messaging a provider, and reviewing a new lab result.
2. **Low-Fidelity Wireframes:** Structural layout concepts for all core screens.
3. **High-Fidelity Interactive Prototype (Figma):** Fully clickable prototype containing:
* Dashboard / Home
* Messaging thread flow
* Test Result detail (with trend graph)
* Billing summary & checkout modal
* Medication list & refill action


4. **Design System & Component Library:**
* Accessible Color Palette (with contrast ratio documentation)
* Typography Scale (optimized for legibility)
* Reusable UI Components (Cards, Buttons, Inputs, Alert Badges)


5. **Design Rationale Document:** A brief summary explaining key visual choices (e.g., card layout vs. list view decisions).

---

## 7. Proposal Questions for the Designer

Please address the following within your pitch/proposal:

1. How will your UI surface flagged/abnormal test results clearly without causing immediate panic for the patient?
2. How do you plan to handle switching between multiple family profiles (e.g., managing a child's medical account)?
3. How will the messaging layout visually frame expected response times to deter patients from using the app during real-world medical emergencies?