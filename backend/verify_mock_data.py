from app import create_app
from models import Student, Attendance, Grade

app = create_app()

def verify_data():
    with app.app_context():
        student_count = Student.query.count()
        attendance_count = Attendance.query.count()
        grade_count = Grade.query.count()
        
        print(f"Verification Results:")
        print(f"Students: {student_count}")
        print(f"Attendance Records: {attendance_count}")
        print(f"Grades: {grade_count}")
        
        if student_count > 0 and attendance_count > 0 and grade_count > 0:
            print("SUCCESS: Data verification passed.")
        else:
            print("FAILURE: Data verification failed.")

if __name__ == '__main__':
    verify_data()
