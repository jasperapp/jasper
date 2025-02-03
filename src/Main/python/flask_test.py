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
    app.run ()


    self.assertIn('<label for="username">Username:</label>', response.text)
    self.assertIn('<label for="password">Password:</label>', response.text)
    self.assertIn('<input type="submit">Login', response.text)

def test_login_form_submission(self):
    app = Flask(__name__)
    app.config['TESTING'] = True
    login_page = app.route('/login')
    response = self.client.post(login_page, {'username': 'test_username', 'password': 'test_password'})
    self.assertEqual(response.status_code, 302)
    self.assertIn('Login successful', response.text)

def test_protected_page(self):
    app = Flask(__name__)


def is_safe(board, row, col):
    for i in range(col):
        if board[row][i] == 1:
            return False
    for i, j in zip(range(row, -1, -1), range(col, -1, -1)):
        if board[i][j] == 1:
            return False
    for i, j in zip(range(row, len(board), 1), range(col, -1, -1)):
        if board[i][j] == 1:
            return False
    return True

def solve_n_queens_util(board, col):
    if col >= len(board):
        return True
    for i in range(len(board)):
        if is_safe(board, i, col):
            board[i][col] = 1
            if solve_n_queens_util(board, col + 1):
                return True
            board[i][col] = 0
    return False

def solve_n_queens(n):
    board = [[0 for _ in range(n)] for _ in range(n)]
    if not solve_n_queens_util(board, 0):
        print("Solution does not exist")
        return False
    print_board(board)
    return True

def print_board(board):
    for row in board:
        print(" ".join(str(x) for x in row))

# Example usage:
solve_n_queens(4)