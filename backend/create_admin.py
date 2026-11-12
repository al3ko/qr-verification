from getpass import getpass

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User


def main():
    print("Create an administrator account")
    school_id = int(input("School ID (100-1000): ").strip())
    first_name = input("First name: ").strip()
    last_name = input("Last name: ").strip()
    email = input("Email: ").strip().lower()
    head_school = input("School headed (SCES, SBS, SLS, SHSS, SIMS): ").strip().upper()
    password = getpass("Password (minimum 8 characters): ")
    confirmation = getpass("Confirm password: ")

    if not 100 <= school_id <= 1000:
        print("Error: Admin School ID must be between 100 and 1000.")
        return
    if not first_name or not last_name:
        print("Error: Enter first and last names.")
        return
    if head_school not in {"SCES", "SBS", "SLS", "SHSS", "SIMS"}:
        print("Error: Choose a valid school code.")
        return
    if len(password) < 8 or password != confirmation:
        print("Error: Password must be 8+ characters and match confirmation.")
        return

    db = SessionLocal()
    try:
        if db.get(User, school_id):
            print("Error: This School ID is already registered.")
            return
        db.add(User(
            school_id=school_id,
            first_name=first_name,
            last_name=last_name,
            full_name=f"{first_name} {last_name}",
            email=email,
            password_hash=hash_password(password),
            role="admin",
            head_school=head_school,
            is_active=True,
        ))
        db.commit()
        print("Administrator account created.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
