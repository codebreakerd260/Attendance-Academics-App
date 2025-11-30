from flask import Flask, request, jsonify
from flask_cors import CORS
from database import db
from models import User, Role, Permission, Student, Attendance, Grade
from auth import Auth, token_required, permission_required, admin_required
from datetime import datetime
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')
    
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    def seed_initial_data():
        permissions_data = {
            'admin': 'Full system access',
            'manage_students': 'Add, edit, and delete students',
            'manage_attendance': 'Mark and manage attendance',
            'manage_grades': 'Add and manage grades',
            'view_data': 'View all data',
            'view_analytics': 'Access analytics and reports'
        }
        
        for perm_name, description in permissions_data.items():
            if not Permission.query.filter_by(name=perm_name).first():
                permission = Permission(name=perm_name, description=description)
                db.session.add(permission)
        
        db.session.commit()
        
        roles_data = {
            'admin': ['admin', 'manage_students', 'manage_attendance', 'manage_grades', 'view_data', 'view_analytics'],
            'teacher': ['manage_students', 'manage_attendance', 'manage_grades', 'view_data', 'view_analytics'],
            'viewer': ['view_data', 'view_analytics']
        }
        
        for role_name, perm_names in roles_data.items():
            role = Role.query.filter_by(name=role_name).first()
            if not role:
                role = Role(name=role_name, description=f'{role_name.title()} role')
                db.session.add(role)
                db.session.flush()
            
            for perm_name in perm_names:
                permission = Permission.query.filter_by(name=perm_name).first()
                if permission and permission not in role.permissions:
                    role.permissions.append(permission)
        
        db.session.commit()
        
        if not User.query.filter_by(username='admin').first():
            admin_role = Role.query.filter_by(name='admin').first()
            admin_user = User(
                username='admin',
                email='admin@school.edu',
                role_id=admin_role.id
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
        
        if not User.query.filter_by(username='teacher').first():
            teacher_role = Role.query.filter_by(name='teacher').first()
            teacher_user = User(
                username='teacher',
                email='teacher@school.edu',
                role_id=teacher_role.id
            )
            teacher_user.set_password('teacher123')
            db.session.add(teacher_user)
        
        if not User.query.filter_by(username='viewer').first():
            viewer_role = Role.query.filter_by(name='viewer').first()
            viewer_user = User(
                username='viewer',
                email='viewer@school.edu',
                role_id=viewer_role.id
            )
            viewer_user.set_password('viewer123')
            db.session.add(viewer_user)
        
        db.session.commit()
    
    # Initialize database and seed data
    with app.app_context():
        db.create_all()
        seed_initial_data()
    
    @app.route('/api/auth/register', methods=['POST'])
    @admin_required
    def register(current_user):
        data = request.json
        
        # Validation
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Username, email, and password are required'}), 400
        
        role = Role.query.filter_by(name=data.get('role', 'viewer')).first()
        
        if not role:
            return jsonify({'message': 'Invalid role'}), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already exists'}), 400
        
        # Email validation
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            return jsonify({'message': 'Invalid email format'}), 400
        
        # Password validation
        if len(data['password']) < 6:
            return jsonify({'message': 'Password must be at least 6 characters long'}), 400
        
        user = User(
            username=data['username'],
            email=data['email'],
            role_id=role.id
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': 'User created successfully'}), 201
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        data = request.json
        user = User.query.filter_by(username=data['username']).first()
        
        if user and user.check_password(data['password']):
            token = Auth.generate_token(user.id, app.config['SECRET_KEY'])
            return jsonify({
                'token': token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role.name,
                    'permissions': [p.name for p in user.role.permissions]
                }
            })
        
        return jsonify({'message': 'Invalid credentials'}), 401
    
    @app.route('/api/students', methods=['GET'])
    @token_required
    def get_students(current_user):
        students = Student.query.all()
        return jsonify([{
            'id': s.id,
            'student_id': s.student_id,
            'name': s.name,
            'email': s.email,
            'class_name': s.class_name
        } for s in students])
    
    @app.route('/api/students/<int:student_id>', methods=['GET'])
    @token_required
    def get_student(current_user, student_id):
        student = Student.query.get_or_404(student_id)
        return jsonify({
            'id': student.id,
            'student_id': student.student_id,
            'name': student.name,
            'email': student.email,
            'class_name': student.class_name
        })
    
    @app.route('/api/students', methods=['POST'])
    @permission_required('manage_students')
    def create_student(current_user):
        data = request.json
        
        # Validation
        if not data.get('student_id') or not data.get('name') or not data.get('email') or not data.get('class_name'):
            return jsonify({'message': 'All fields are required'}), 400
        
        if Student.query.filter_by(student_id=data['student_id']).first():
            return jsonify({'message': 'Student ID already exists'}), 400
        
        if Student.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already exists'}), 400
        
        # Email validation
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            return jsonify({'message': 'Invalid email format'}), 400
        
        student = Student(
            student_id=data['student_id'],
            name=data['name'],
            email=data['email'],
            class_name=data['class_name'],
            created_by=current_user.id
        )
        db.session.add(student)
        db.session.commit()
        return jsonify({'message': 'Student created successfully', 'id': student.id}), 201
    
    @app.route('/api/students/<int:student_id>', methods=['PUT'])
    @permission_required('manage_students')
    def update_student(current_user, student_id):
        student = Student.query.get_or_404(student_id)
        data = request.json
        
        if 'email' in data and data['email'] != student.email:
            if Student.query.filter_by(email=data['email']).first():
                return jsonify({'message': 'Email already exists'}), 400
            # Email validation
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, data['email']):
                return jsonify({'message': 'Invalid email format'}), 400
        
        student.name = data.get('name', student.name)
        student.email = data.get('email', student.email)
        student.class_name = data.get('class_name', student.class_name)
        
        db.session.commit()
        return jsonify({'message': 'Student updated successfully'})
    
    @app.route('/api/students/<int:student_id>', methods=['DELETE'])
    @permission_required('manage_students')
    def delete_student(current_user, student_id):
        student = Student.query.get_or_404(student_id)
        db.session.delete(student)
        db.session.commit()
        return jsonify({'message': 'Student deleted successfully'})
    
    @app.route('/api/attendance', methods=['POST'])
    @permission_required('manage_attendance')
    def mark_attendance(current_user):
        data = request.json
        attendance = Attendance(
            student_id=data['student_id'],
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            status=data['status'],
            subject=data['subject'],
            created_by=current_user.id
        )
        db.session.add(attendance)
        db.session.commit()
        return jsonify({'message': 'Attendance marked successfully'}), 201
    
    @app.route('/api/attendance/student/<int:student_id>', methods=['GET'])
    @token_required
    def get_student_attendance(current_user, student_id):
        attendances = Attendance.query.filter_by(student_id=student_id).order_by(Attendance.date.desc()).all()
        return jsonify([{
            'id': a.id,
            'date': a.date.isoformat(),
            'status': a.status,
            'subject': a.subject
        } for a in attendances])
    
    @app.route('/api/attendance/<int:attendance_id>', methods=['PUT'])
    @permission_required('manage_attendance')
    def update_attendance(current_user, attendance_id):
        attendance = Attendance.query.get_or_404(attendance_id)
        data = request.json
        
        if 'date' in data:
            attendance.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        if 'status' in data:
            attendance.status = data['status']
        if 'subject' in data:
            attendance.subject = data['subject']
        
        db.session.commit()
        return jsonify({'message': 'Attendance updated successfully'})
    
    @app.route('/api/attendance/<int:attendance_id>', methods=['DELETE'])
    @permission_required('manage_attendance')
    def delete_attendance(current_user, attendance_id):
        attendance = Attendance.query.get_or_404(attendance_id)
        db.session.delete(attendance)
        db.session.commit()
        return jsonify({'message': 'Attendance deleted successfully'})
    
    @app.route('/api/attendance/bulk', methods=['POST'])
    @permission_required('manage_attendance')
    def bulk_mark_attendance(current_user):
        data = request.json
        date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        subject = data['subject']
        records = data.get('records', [])
        
        created = []
        errors = []
        
        for record in records:
            try:
                attendance = Attendance(
                    student_id=record['student_id'],
                    date=date,
                    status=record['status'],
                    subject=subject,
                    created_by=current_user.id
                )
                db.session.add(attendance)
                created.append(record['student_id'])
            except Exception as e:
                errors.append({'student_id': record.get('student_id'), 'error': str(e)})
        
        db.session.commit()
        return jsonify({
            'message': f'Attendance marked for {len(created)} students',
            'created': created,
            'errors': errors
        }), 201
    
    @app.route('/api/grades', methods=['POST'])
    @permission_required('manage_grades')
    def add_grade(current_user):
        data = request.json
        grade = Grade(
            student_id=data['student_id'],
            subject=data['subject'],
            assignment=data['assignment'],
            score=data['score'],
            max_score=data['max_score'],
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            created_by=current_user.id
        )
        db.session.add(grade)
        db.session.commit()
        return jsonify({'message': 'Grade added successfully'}), 201
    
    @app.route('/api/grades/student/<int:student_id>', methods=['GET'])
    @token_required
    def get_student_grades(current_user, student_id):
        grades = Grade.query.filter_by(student_id=student_id).order_by(Grade.date.desc()).all()
        return jsonify([{
            'id': g.id,
            'subject': g.subject,
            'assignment': g.assignment,
            'score': g.score,
            'max_score': g.max_score,
            'percentage': round((g.score / g.max_score * 100), 2) if g.max_score > 0 else 0,
            'date': g.date.isoformat()
        } for g in grades])
    
    @app.route('/api/grades/<int:grade_id>', methods=['PUT'])
    @permission_required('manage_grades')
    def update_grade(current_user, grade_id):
        grade = Grade.query.get_or_404(grade_id)
        data = request.json
        
        if 'subject' in data:
            grade.subject = data['subject']
        if 'assignment' in data:
            grade.assignment = data['assignment']
        if 'score' in data:
            grade.score = data['score']
        if 'max_score' in data:
            grade.max_score = data['max_score']
        if 'date' in data:
            grade.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        
        db.session.commit()
        return jsonify({'message': 'Grade updated successfully'})
    
    @app.route('/api/grades/<int:grade_id>', methods=['DELETE'])
    @permission_required('manage_grades')
    def delete_grade(current_user, grade_id):
        grade = Grade.query.get_or_404(grade_id)
        db.session.delete(grade)
        db.session.commit()
        return jsonify({'message': 'Grade deleted successfully'})
    
    @app.route('/api/analytics/attendance-summary')
    @permission_required('view_analytics')
    def attendance_summary(current_user):
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        subject = request.args.get('subject')
        
        students = Student.query.all()
        result = []
        
        for student in students:
            query = Attendance.query.filter_by(student_id=student.id)
            
            if start_date:
                query = query.filter(Attendance.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
            if end_date:
                query = query.filter(Attendance.date <= datetime.strptime(end_date, '%Y-%m-%d').date())
            if subject:
                query = query.filter_by(subject=subject)
            
            attendances = query.all()
            total_classes = len(attendances)
            present_count = sum(1 for a in attendances if a.status == 'Present')
            attendance_rate = (present_count / total_classes * 100) if total_classes > 0 else 0
            
            result.append({
                'student_id': student.student_id,
                'student_name': student.name,
                'class_name': student.class_name,
                'total_classes': total_classes,
                'present_count': present_count,
                'attendance_rate': round(attendance_rate, 2)
            })
        
        return jsonify(result)
    
    @app.route('/api/analytics/grades-summary')
    @permission_required('view_analytics')
    def grades_summary(current_user):
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        subject = request.args.get('subject')
        
        students = Student.query.all()
        result = []
        
        for student in students:
            query = Grade.query.filter_by(student_id=student.id)
            
            if start_date:
                query = query.filter(Grade.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
            if end_date:
                query = query.filter(Grade.date <= datetime.strptime(end_date, '%Y-%m-%d').date())
            if subject:
                query = query.filter_by(subject=subject)
            
            grades = query.all()
            if grades:
                total_percentage = sum((g.score / g.max_score * 100) for g in grades if g.max_score > 0)
                average = total_percentage / len(grades) if grades else 0
                
                result.append({
                    'student_id': student.student_id,
                    'student_name': student.name,
                    'class_name': student.class_name,
                    'total_assignments': len(grades),
                    'average_grade': round(average, 2)
                })
        
        return jsonify(result)
    
    @app.route('/api/export/students', methods=['GET'])
    @permission_required('view_data')
    def export_students(current_user):
        students = Student.query.all()
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Student ID', 'Name', 'Email', 'Class'])
        
        for student in students:
            writer.writerow([student.student_id, student.name, student.email, student.class_name])
        
        from flask import Response
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': 'attachment; filename=students.csv'}
        )
    
    @app.route('/api/export/attendance', methods=['GET'])
    @permission_required('view_data')
    def export_attendance(current_user):
        attendances = Attendance.query.order_by(Attendance.date.desc()).all()
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Date', 'Student ID', 'Student Name', 'Subject', 'Status'])
        
        for attendance in attendances:
            writer.writerow([
                attendance.date.isoformat(),
                attendance.student.student_id,
                attendance.student.name,
                attendance.subject,
                attendance.status
            ])
        
        from flask import Response
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': 'attachment; filename=attendance.csv'}
        )
    
    @app.route('/api/export/grades', methods=['GET'])
    @permission_required('view_data')
    def export_grades(current_user):
        grades = Grade.query.order_by(Grade.date.desc()).all()
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Date', 'Student ID', 'Student Name', 'Subject', 'Assignment', 'Score', 'Max Score', 'Percentage'])
        
        for grade in grades:
            percentage = round((grade.score / grade.max_score * 100), 2) if grade.max_score > 0 else 0
            writer.writerow([
                grade.date.isoformat(),
                grade.student.student_id,
                grade.student.name,
                grade.subject,
                grade.assignment,
                grade.score,
                grade.max_score,
                percentage
            ])
        
        from flask import Response
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': 'attachment; filename=grades.csv'}
        )
    
    @app.route('/api/users', methods=['GET'])
    @admin_required
    def get_users(current_user):
        users = User.query.all()
        return jsonify([{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'role': u.role.name
        } for u in users])
    
    @app.route('/api/users/<int:user_id>', methods=['PUT'])
    @admin_required
    def update_user(current_user, user_id):
        if user_id == current_user.id:
            return jsonify({'message': 'Cannot modify your own account'}), 400
        
        user = User.query.get_or_404(user_id)
        data = request.json
        
        if 'username' in data and data['username'] != user.username:
            if not data['username']:
                return jsonify({'message': 'Username cannot be empty'}), 400
            if User.query.filter_by(username=data['username']).first():
                return jsonify({'message': 'Username already exists'}), 400
            user.username = data['username']
        
        if 'email' in data and data['email'] != user.email:
            if not data['email']:
                return jsonify({'message': 'Email cannot be empty'}), 400
            if User.query.filter_by(email=data['email']).first():
                return jsonify({'message': 'Email already exists'}), 400
            # Email validation
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, data['email']):
                return jsonify({'message': 'Invalid email format'}), 400
            user.email = data['email']
        
        if 'role' in data:
            role = Role.query.filter_by(name=data['role']).first()
            if not role:
                return jsonify({'message': 'Invalid role'}), 400
            user.role_id = role.id
        
        if 'password' in data and data['password']:
            if len(data['password']) < 6:
                return jsonify({'message': 'Password must be at least 6 characters long'}), 400
            user.set_password(data['password'])
        
        db.session.commit()
        return jsonify({'message': 'User updated successfully'})
    
    @app.route('/api/users/<int:user_id>', methods=['DELETE'])
    @admin_required
    def delete_user(current_user, user_id):
        if user_id == current_user.id:
            return jsonify({'message': 'Cannot delete your own account'}), 400
        
        user = User.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'})
    
    @app.route('/api/roles', methods=['GET'])
    @admin_required
    def get_roles(current_user):
        roles = Role.query.all()
        return jsonify([{
            'id': r.id,
            'name': r.name,
            'description': r.description,
            'permissions': [p.name for p in r.permissions]
        } for r in roles])
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5002, debug=True)
