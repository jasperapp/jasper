import unittest
from flask import Flask, request, render_template_string, login, redirect, url_for
from flask_test import TestCase


class TestFlaskApp(TestCase):
    def test_login_page(self):
        app = Flask(__name__)
        app.config['TESTING'] = True
        login_page = app.route('/login')
        response = self.client.get(login_page)
        self.assertEqual(response.status_code, 200)
        self.assertIn('<form', response.data)

    def test_login_form(self):
        app = Flask(__name__)
        app.config['TESTING'] = True
        login_page = app.route('/login')
        response = self.client.post(login_page, {'username':
        import unittest
        from flask import Flask, request, render_template_string, login, redirect, url_for
        from flask_test import TestCase


class TestFlaskApp(TestCase):
    def test_login_page(self):
        app = Flask(__name__)
        app.config['TESTING'] = True
        login_page = app.route('/login')
        response = self.client.get(login_page)
        self.assertEqual(response.status_code, 200)
        self.assertIn('<form', response.data)

    def test_login_form(self):
        app = Flask(__name__)
        app.config['TESTING'] = True
        login_page = app.route('/login')
        response = self.client.post(login_page, {'username':