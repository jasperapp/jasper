def test_login_page():
    # Test that the login page is accessible
    response = app.get('/login')
    assert response.status_code == 200
    
    # Test that the login form is valid
    response = app.post('/login', data={'username': 'test', 'password': 'test'})
    assert response.status_code == 302
    
    # Test that the user is logged in after successful login
    response = app.get('/')
    assert response.status_code == 200
    assert response.json['user'] == {'username': 'test', 'id': 1}
    
    # Test that the user is not logged in after invalid login
    response = app.post('/login', data={'username': 'test', 'password': 'invalid'})
    assertdef test_login_page():
    # Test that the login page is accessible
    response = app.get('/login')
    assert response.status_code == 200
    
    # Test that the login form is valid
    response = app.post('/login', data={'username': 'test', 'password': 'test'})
    assert response.status_code == 302
    
    # Test that the user is logged in after successful login
    response = app.get('/')
    assert response.status_code == 200
    assert response.json['user'] == {'username': 'test', 'id': 1}
    
    # Test that the user is not logged in after invalid login
    response = app.post('/login', data={'username': 'test', 'password': 'invalid'})
    assert