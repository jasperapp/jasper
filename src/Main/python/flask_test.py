import sqlite3
from flask import Flask, request, render_template_string

app = Flask(__name__)

# Removed hard-coded credentials and secret
DB_PATH = 'database.db'

# Enhanced login function to use parameterized queries to avoid SQL injection vulnerability
def login(username, password):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    query = "SELECT * FROM users WHERE username=? AND password=?"
    cursor.execute(query, (username, password))
    
    user = cursor.fetchone()
    
    conn.close()
    
    
    return user

@app.route('/login', methods=['POST'])
def login_page():
    username = request.form['username']
    password = request.form['password']
    
    user = login(username, password)
    
    u
    if user:
        return 'Login successful'
    else:
        return 'Login failed'

# Properly escaping user input to prevent XSS vulnerability
@app.route('/hello')
def hello_page():
    name = request.args.get('name')
    
    html = "<h1>Hello, {{ name }}!</h1>"
    
    return render_template_string(html, name=name)

if __name__ == '__main__':
    app.run()
