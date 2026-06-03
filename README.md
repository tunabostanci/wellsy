# Wellsy — AI-Powered Healthcare Appointment System

Wellsy is a full-stack web application that streamlines clinical appointment management through an AI-assisted triage chatbot, smart doctor matching, and a multi-role dashboard system for patients, doctors, staff, and administrators.

---

## Features

### Patient
- **AI Chatbot (Wellsy Assistant)** — Chat with a local LLM (Llama 3 via Ollama) about symptoms in real time
- **Symptom Checker** — Guided 5-step symptom form with AI-generated diagnosis and clinic recommendations
- **Emergency Detection** — Automatically halts booking flow and prompts 112 for critical keywords (chest pain, breathing difficulty, etc.)
- **AI Doctor Matching** — Chatbot conversation history is analyzed to rank doctors by specialty match score
- **Appointment Booking** — Select a time slot, attach personal notes, and submit a booking request with AI pre-diagnosis included automatically
- **Appointment Tracking** — View upcoming and past appointments with live status (Pending / Confirmed / Cancellation Requested)
- **Cancellation Requests** — Submit cancellation requests directly from the appointment list
- **Profile Management** — Update name, phone number, and password

### Doctor
- **Doctor Dashboard** — View assigned patients and appointment history per patient

### Staff (Clinic Personnel)
- **Appointment Dashboard** — Overview of all clinic appointments with status metrics
- **Approval Workflow** — Confirm or reject pending appointment requests
- **Change Requests** — Dedicated view for cancellation requests from patients
- **Manual Booking** — Staff can create appointments on behalf of patients
- **Email Notification** — Patients automatically receive a confirmation email (via Resend) when their appointment is approved

### Admin
- **System Overview** — Live count of registered doctors and users
- **Account Management** — Create new doctor, staff, or admin accounts from the panel

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), plain CSS |
| Backend | Node.js, Express.js (ESM) |
| Database | PostgreSQL (via `pg` pool) |
| AI / LLM | Ollama (Llama 3) — local inference |
| Email | Resend API |
| Containerization | Docker |
| Icons | Tabler Icons (`ti-*`) |

---

## Project Structure

```
wellsy/
├── frontend/
│   └── src/
│       ├── App.jsx                    # Root router — role-based layout switcher
│       ├── main.jsx                   # React entry point
│       ├── styles.css                 # Global styles
│       └── components/
│           ├── Login.jsx              # Role selector + login + registration
│           ├── Sidebar.jsx            # Reusable navigation sidebar
│           ├── PatientChatbot.jsx     # AI chat + symptom checker
│           ├── DoctorListing.jsx      # AI-ranked doctor cards
│           ├── AppointmentBookingGrid.jsx  # Time slot picker + booking form
│           ├── AppointmentTracking.jsx     # Upcoming & past appointments
│           ├── PatientProfile.jsx     # Profile settings
│           ├── DoctorDashboard.jsx    # Doctor's patient & appointment view
│           ├── StaffPanel.jsx         # Staff management panel
│           └── AdminPanel.jsx         # Admin control panel
├── backend/
│   ├── server.js                      # Express API + DB init + Ollama proxy
│   ├── package.json
│   └── Dockerfile
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [PostgreSQL](https://www.postgresql.org/) (or Docker)
- [Ollama](https://ollama.com/) with Llama 3 pulled locally
- A [Resend](https://resend.com/) API key for email notifications

### 1. Pull the Llama 3 model

```bash
ollama pull llama3
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/wellsy_db
RESEND_API_KEY=your_resend_api_key_here
OLLAMA_URL=http://localhost:11434/api/chat
PORT=4000
```

Start the backend:

```bash
npm run dev
```

On first run, the server automatically creates the required database tables and seeds a default admin and staff account.

### 3. Setup

```bash
docker-compose up --build
```

The app will be available at `http://localhost`.


## Default Accounts

These accounts are seeded automatically on first startup:

| Role | Email | Password |
|---|---|---|
| Admin | admin@wellsy.com | admin123 |
| Staff | mert@wellsy.com | staff123 |

Patient accounts are created via the Sign Up form. Doctor accounts are created by an Admin through the panel.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login for all roles |
| POST | `/api/patients` | Register a new patient |
| GET | `/api/patients` | List all patients (admin/staff) |
| PUT | `/api/patients/:id` | Update patient profile |
| GET | `/api/doctors` | List all doctors |
| POST | `/api/admin/create-doctor` | Create a doctor account (admin) |
| POST | `/api/admin/create-staff` | Create a staff/admin account (admin) |
| POST | `/api/appointments` | Book a new appointment |
| GET | `/api/patients/:id/appointments` | Get a patient's appointments |
| GET | `/api/admin/all-appointments` | Get all appointments (staff/admin) |
| PUT | `/api/appointments/:id/status` | Update appointment status + send email |
| PUT | `/api/appointments/:id/request-cancel` | Patient requests cancellation |
| GET | `/api/admin/change-requests` | List cancellation requests |
| POST | `/api/chatbot/chat` | Proxy to Ollama LLM for chat |
| POST | `/api/chatbot/match-doctors` | AI doctor matching from chat history |
| GET | `/api/doctors/:id/patients` | Get patients linked to a doctor |
| GET | `/api/doctors/:doctorId/patients/:patientId/history` | Get a patient's visit history for a doctor |

---

## Notes

- Passwords are stored in plain text. For production use, replace with bcrypt hashing.
- The AI doctor matching endpoint requires Ollama to be running locally. If unavailable, the system falls back to a default 50% match score for all doctors.
- The frontend API base URL (`http://localhost`) is hardcoded in components. For deployment, move it to an environment variable.

---

## License

This project was developed as part of a university software engineering course. All rights reserved by the author.