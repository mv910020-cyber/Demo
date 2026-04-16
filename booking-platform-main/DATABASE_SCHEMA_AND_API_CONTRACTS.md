# Database Schema and API Contracts

This frontend uses the backend API at `NEXT_PUBLIC_API_URL` and expects the following core entities.

## Database Schema

### `users`
- `id`
- `full_name`
- `email`
- `password_hash`
- `role` (`admin`, `sales`, `technical`, `management`)
- `created_at`

### `availabilities`
- `id`
- `user_id`
- `day_of_week` (`0`-`6`)
- `start_time`
- `end_time`
- `is_available`

### `demos`
- `id`
- `product_interest`
- `company_name`
- `contact_name`
- `contact_email`
- `contact_phone`
- `preferred_datetime`
- `final_datetime`
- `demo_type` (`online`, `offline`)
- `status` (`new`, `scheduled`, `confirmed`, `completed`, `follow_up`, `converted`, `lost`)
- `sales_rep_id`
- `technical_presenter_id`
- `meeting_provider` (`google_meet`, `zoom`, `teams`)
- `meeting_link`
- `client_feedback`
- `pain_points`
- `requirements_notes`
- `budget_signals`
- `expected_timeline`
- `lost_reason`
- `recording_url`
- `recording_notes`
- `recording_uploaded_at`

### `action_items`
- `id`
- `demo_id`
- `title`
- `details`
- `owner`
- `deadline`
- `priority`
- `status`

### `requirements`
- `id`
- `demo_id`
- `title`
- `description`
- `assigned_team`
- `priority`
- `status`

### `demo_reminders`
- `id`
- `demo_id`
- `channel` (`email`, `whatsapp`)
- `remind_at`
- `attempt_count`
- `max_attempts`
- `status` (`pending`, `sent`, `failed`)
- `failure_reason`
- `sent_at`

## API Contracts

### Auth
- `POST /auth/login`
- `POST /auth/register`

### Users
- `GET /users/me`
- `GET /users/`
- `GET /users/{user_id}`

### Demos
- `GET /demos/`
- `POST /demos/`
- `GET /demos/{demo_id}`
- `POST /demos/{demo_id}/schedule`
- `POST /demos/{demo_id}/status`
- `POST /demos/{demo_id}/post-notes`
- `PATCH /demos/{demo_id}/recording`

### Reminders
- `GET /demos/{demo_id}/reminders/`
- `POST /demos/{demo_id}/reminders/`

### Dashboard
- `GET /dashboard/overview`
- `GET /dashboard/ops-summary`
- `GET /dashboard/dead-letter-reminders`

### Integrations used by frontend
- Google Meet, Zoom, Teams meeting links
- Gmail/SMTP and WhatsApp message handoff via backend scheduling flow
