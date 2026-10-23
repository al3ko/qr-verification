from getpass import getpass

from sqlalchemy import func

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User


def main():
    print("Create the first administrator account")

    full_name = input("Full name: ").strip()
    email = input("Email: ").strip().lower()
    password = getpass("Password (minimum 8 characters): ")
    confirm_password = getpass("Confirm password: ")

    if len(full_name) < 2:
        print("Error: Enter a valid full name.")
        return

    if len(password) < 8:
        print("Error: Password must be at least 8 characters.")
        return

    if password != confirm_password:
        print("Error: Passwords do not match.")
        return

    db = SessionLocal()

    try:
        existing_user = (
            db.query(User)
            .filter(func.lower(User.email) == email)
            .first()
        )

        if existing_user:
            print("Error: An account with this email already exists.")
            return

        admin = User(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role="admin",
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print("Administrator account created successfully.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()