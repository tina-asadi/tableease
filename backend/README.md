# TableEase backend (Milestone 6: Django, database, authentication, initial API)

Django + Django REST Framework. SQLite in development, PostgreSQL when `POSTGRES_DB` is set.

## Run it
```bash
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations reservations
python manage.py migrate
python manage.py seed          # 12 tables + accounts: staff / staffpass123, guest / guestpass123
python manage.py runserver     # http://127.0.0.1:8000/api/
python manage.py test          # automated tests for the rules below
```
Django admin: `python manage.py createsuperuser`, then http://127.0.0.1:8000/admin/

## API
| Method and path | Who | What |
|---|---|---|
| POST `/api/auth/register/` `/login/` `/logout/` · GET `/api/auth/me/` | public / signed in | Token authentication. Registration always creates a customer, never staff. |
| GET `/api/availability/?date=&party=` | public | Crowding level (quiet, moderate, busy, full) for every slot. |
| GET `/api/availability/?date=&party=&time=19:00` | public | Tables that fit the party and are free. |
| POST `/api/reservations/` | public | Create a booking. Server checks party size, date, opening days, time slot, table size and overlap. 409 `conflict` if the table was just taken. |
| GET `/api/reservations/` | customer | Their own bookings. |
| POST `/api/reservations/{id}/cancel/` | owner or staff | Cancel; the first waiting party gets a 15 minute hold. |
| GET `/api/reservations/lookup/?reference=&email=` · POST `/cancel-guest/` | guest | Look up or cancel with reference and email. |
| POST `/api/waitlist/` | public | Join the waitlist (only when the time is full). |
| POST `/api/reservations/respond-offer/` | guest | Accept or decline a waitlist hold. |
| GET `/api/reservations/all/?date=&status=&q=` | staff | Reservation management with filters and search. |
| POST `/api/reservations/staff/` | staff | Walk-in or phone booking. |
| POST `/api/reservations/{id}/status/` | staff | confirm, seat, complete, no show, cancel (workflow enforced). |
| `/api/tables/` · `/api/blocked-tables/` | read: public, write: staff | Table management and per-day availability blocks. |
| GET `/api/customers/?q=` | staff | Customer management: bookings, completed, cancelled, no shows, last visit. |
| GET `/api/staff/insights/?date=` | staff | Reservations, covers, seats, waitlist and no-show rate. |
| GET `/api/waitlist/` | staff | Waitlist entries. |

Send the token as `Authorization: Token <key>`.

## Rules (all in `reservations/services.py`)
Open Tuesday to Sunday, last seating 8:30 PM, 90 minute stays, parties of 1 to 8, bookings up to 60 days ahead.
Two bookings overlap when `existing.start < new.end and existing.end > new.start`; the table row is locked inside a transaction so simultaneous requests cannot double-book.
