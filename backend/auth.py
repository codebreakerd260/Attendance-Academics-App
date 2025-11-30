from flask import jsonify, request
from functools import wraps
import jwt
import datetime
from models import User

class Auth:
    @staticmethod
    def generate_token(user_id, secret_key):
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
            'iat': datetime.datetime.utcnow(),
            'sub': user_id
        }
        return jwt.encode(payload, secret_key, algorithm='HS256')
    
    @staticmethod
    def decode_token(token, secret_key):
        try:
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            return payload['sub']
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            from flask import current_app
            user_id = Auth.decode_token(token, current_app.config['SECRET_KEY'])
            if not user_id:
                return jsonify({'message': 'Token is invalid'}), 401
            
            current_user = User.query.get(user_id)
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
            
        except Exception as e:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def permission_required(permission):
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(current_user, *args, **kwargs):
            if not current_user.has_permission(permission):
                return jsonify({'message': 'Insufficient permissions'}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

def admin_required(f):
    return permission_required('admin')(f)

def teacher_required(f):
    return permission_required('manage_students')(f)

def viewer_required(f):
    return permission_required('view_data')(f)
