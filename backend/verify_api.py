import requests
import json
import sys

BASE_URL = "http://127.0.0.1:5002/api"

class Color:
    GREEN = '\033[92m'
    RED = '\033[91m'
    END = '\033[0m'

def print_pass(message):
    print(f"{Color.GREEN}[PASS] {message}{Color.END}")

def print_fail(message, error=None):
    print(f"{Color.RED}[FAIL] {message}{Color.END}")
    if error:
        print(f"{Color.RED}Error: {error}{Color.END}")

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None

    def login(self, username, password):
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json={
                "username": username,
                "password": password
            })
            if response.status_code == 200:
                self.token = response.json()['token']
                self.session.headers.update({'Authorization': f'Bearer {self.token}'})
                print_pass(f"Login successful for {username}")
                return True
            else:
                print_fail(f"Login failed for {username}", response.text)
                return False
        except Exception as e:
            print_fail(f"Login exception for {username}", str(e))
            return False

    def test_students(self):
        print("\n--- Testing Students ---")
        # Create
        student_data = {
            "student_id": "TEST001",
            "name": "Test Student",
            "email": "test@student.com",
            "class_name": "Class 10A"
        }
        res = self.session.post(f"{BASE_URL}/students", json=student_data)
        if res.status_code == 201:
            print_pass("Create Student")
            student_id = res.json()['id']
        else:
            print_fail("Create Student", res.text)
            return None

        # Get All
        res = self.session.get(f"{BASE_URL}/students")
        if res.status_code == 200 and any(s['student_id'] == 'TEST001' for s in res.json()):
            print_pass("Get All Students")
        else:
            print_fail("Get All Students", res.text)

        # Update
        update_data = {"name": "Updated Student"}
        res = self.session.put(f"{BASE_URL}/students/{student_id}", json=update_data)
        if res.status_code == 200:
            print_pass("Update Student")
        else:
            print_fail("Update Student", res.text)

        return student_id

    def test_attendance(self, student_id):
        print("\n--- Testing Attendance ---")
        # Mark
        data = {
            "student_id": student_id,
            "date": "2023-01-01",
            "status": "Present",
            "subject": "Math"
        }
        res = self.session.post(f"{BASE_URL}/attendance", json=data)
        if res.status_code == 201:
            print_pass("Mark Attendance")
        else:
            print_fail("Mark Attendance", res.text)

        # Bulk Mark
        bulk_data = {
            "date": "2023-01-02",
            "subject": "Science",
            "records": [
                {"student_id": student_id, "status": "Absent"}
            ]
        }
        res = self.session.post(f"{BASE_URL}/attendance/bulk", json=bulk_data)
        if res.status_code == 201:
            print_pass("Bulk Mark Attendance")
        else:
            print_fail("Bulk Mark Attendance", res.text)

        # Get History
        res = self.session.get(f"{BASE_URL}/attendance/student/{student_id}")
        if res.status_code == 200 and len(res.json()) >= 2:
            print_pass("Get Attendance History")
        else:
            print_fail("Get Attendance History", res.text)

    def test_grades(self, student_id):
        print("\n--- Testing Grades ---")
        # Add Grade
        data = {
            "student_id": student_id,
            "subject": "Math",
            "assignment": "Test 1",
            "score": 85,
            "max_score": 100,
            "date": "2023-01-10"
        }
        res = self.session.post(f"{BASE_URL}/grades", json=data)
        if res.status_code == 201:
            print_pass("Add Grade")
            grade_id = 1 # Assuming first one, but we can't easily get ID from create response if not returned. 
            # Actually create returns message only. We need to fetch to get ID.
        else:
            print_fail("Add Grade", res.text)

        # Get History
        res = self.session.get(f"{BASE_URL}/grades/student/{student_id}")
        if res.status_code == 200 and len(res.json()) > 0:
            print_pass("Get Grades History")
            grade_id = res.json()[0]['id']
            
            # Update Grade
            update_data = {"score": 90}
            res = self.session.put(f"{BASE_URL}/grades/{grade_id}", json=update_data)
            if res.status_code == 200:
                print_pass("Update Grade")
            else:
                print_fail("Update Grade", res.text)
        else:
            print_fail("Get Grades History", res.text)

    def test_analytics(self):
        print("\n--- Testing Analytics ---")
        res = self.session.get(f"{BASE_URL}/analytics/attendance-summary")
        if res.status_code == 200:
            print_pass("Attendance Summary")
        else:
            print_fail("Attendance Summary", res.text)

        res = self.session.get(f"{BASE_URL}/analytics/grades-summary")
        if res.status_code == 200:
            print_pass("Grades Summary")
        else:
            print_fail("Grades Summary", res.text)

    def test_exports(self):
        print("\n--- Testing Exports ---")
        for endpoint in ['students', 'attendance', 'grades']:
            res = self.session.get(f"{BASE_URL}/export/{endpoint}")
            if res.status_code == 200 and res.headers['Content-Type'] == 'text/csv':
                print_pass(f"Export {endpoint.capitalize()}")
            else:
                print_fail(f"Export {endpoint.capitalize()}", f"{res.status_code} - {res.headers.get('Content-Type')}")

    def run(self):
        print("Starting Backend Verification...")
        
        # 1. Login as Admin
        if not self.login("admin", "admin123"):
            return

        # 2. Student Operations
        student_id = self.test_students()
        if not student_id:
            print("Skipping dependent tests due to student creation failure")
            return

        # 3. Attendance Operations
        self.test_attendance(student_id)

        # 4. Grades Operations
        self.test_grades(student_id)

        # 5. Analytics
        self.test_analytics()

        # 6. Exports
        self.test_exports()

        # Cleanup (Delete Student)
        print("\n--- Cleanup ---")
        res = self.session.delete(f"{BASE_URL}/students/{student_id}")
        if res.status_code == 200:
            print_pass("Delete Test Student")
        else:
            print_fail("Delete Test Student", res.text)

if __name__ == "__main__":
    tester = APITester()
    tester.run()
