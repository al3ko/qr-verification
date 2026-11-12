from getpass import getpass

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User


def main():
    raw_school_id = input("Admin School ID [123]: ").strip() or "123"
    try:
        school_id = int(raw_school_id)
    except ValueError:
        print("Error: School ID must be numeric.")
        return

    password = getpass("New password (minimum 8 characters): ")
    confirmation = getpass("Confirm new password: ")
    if len(password) < 8:
        print("Error: Password must be at least 8 characters.")
        return
    if password != confirmation:
        print("Error: Passwords do not match.")
        return

    db = SessionLocal()
    try:
        user = db.get(User, school_id)
        if user is None or user.role != "admin":
            print("Error: No administrator account exists with that School ID.")
            return
        user.password_hash = hash_password(password)
        db.commit()
        print(f"Password reset for administrator School ID {school_id}.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
