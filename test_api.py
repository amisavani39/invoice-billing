import requests
import json

url = "https://invoice-billing-s4u1.onrender.com/api/auth/register"
data = {
    "name": "Test User",
    "email": "test4@example.com",
    "password": "password123"
}
response = requests.post(url, json=data)
print(response.status_code)
print(response.text)
