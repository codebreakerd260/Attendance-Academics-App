import os
import random
from datetime import datetime, timedelta
from app import create_app
from database import db
from models import Student, Attendance, Grade, User, Role

app = create_app()

def seed_data():
    with app.app_context():
        print("Starting mock data generation...")
        
        # Get admin user for 'created_by' field
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            print("Error: Admin user not found. Please run the app first to seed initial users.")
            return
            
        admin_id = admin.id

        # 1. Create Students
        first_names = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 
                       'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']
        
        classes = ['10-A', '10-B', '11-A', '11-B', '12-A', '12-B']
        
        students = []
        print("Creating students...")
        for i in range(50):
            fname = random.choice(first_names)
            lname = random.choice(last_names)
            name = f"{fname} {lname}"
            student_id = f"S{2024000 + i}"
            email = f"{fname.lower()}.{lname.lower()}{i}@example.com"
            class_name = random.choice(classes)
            
            # Check if student exists
            if not Student.query.filter_by(student_id=student_id).first():
                student = Student(
                    student_id=student_id,
                    name=name,
                    email=email,
                    class_name=class_name,
                    created_by=admin_id
                )
                db.session.add(student)
                students.append(student)
        
        db.session.commit()
        print(f"Created {len(students)} new students.")
        
        # Refresh students list to include existing ones if any
        all_students = Student.query.all()
        
        # 2. Create Attendance
        print("Creating attendance records...")
        subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History']
        statuses = ['Present', 'Present', 'Present', 'Absent', 'Late'] # Weighted towards Present
        
        start_date = datetime.now().date() - timedelta(days=30)
        attendance_count = 0
        
        for student in all_students:
            # Generate attendance for last 30 days
            for day in range(30):
                current_date = start_date + timedelta(days=day)
                
                # Skip weekends
                if current_date.weekday() >= 5:
                    continue
                
                # Randomly decide if we mark attendance for this day (simulating realistic data gaps or holidays)
                if random.random() > 0.1: 
                    status = random.choice(statuses)
                    subject = random.choice(subjects) # In a real school, schedule matters, but here random is fine
                    
                    # Check if already exists to avoid duplicates if run multiple times
                    if not Attendance.query.filter_by(student_id=student.id, date=current_date, subject=subject).first():
                        att = Attendance(
                            student_id=student.id,
                            date=current_date,
                            status=status,
                            subject=subject,
                            created_by=admin_id
                        )
                        db.session.add(att)
                        attendance_count += 1
                        
            if attendance_count % 100 == 0:
                db.session.commit() # Commit in batches
                
        db.session.commit()
        print(f"Created {attendance_count} attendance records.")

        # 3. Create Grades
        print("Creating grades...")
        assignments = ['Midterm Exam', 'Final Exam', 'Quiz 1', 'Quiz 2', 'Project']
        grade_count = 0
        
        for student in all_students:
            for subject in subjects:
                # 3-5 assignments per subject
                num_assignments = random.randint(3, 5)
                selected_assignments = random.sample(assignments, num_assignments)
                
                for assignment in selected_assignments:
                    max_score = 100
                    score = random.randint(60, 100)
                    date = start_date + timedelta(days=random.randint(0, 30))
                    
                    grade = Grade(
                        student_id=student.id,
                        subject=subject,
                        assignment=assignment,
                        score=score,
                        max_score=max_score,
                        date=date,
                        created_by=admin_id
                    )
                    db.session.add(grade)
                    grade_count += 1
        
        db.session.commit()
        print(f"Created {grade_count} grade records.")
        print("Mock data generation complete!")

if __name__ == '__main__':
    seed_data()
