import urllib.request
import urllib.error
import json

# Create a test file
with open('test_sample.txt', 'w') as f:
    f.write('This is a test contract.\n\nClause 1: Confidentiality.\nClause 2: Termination.\nClause 3: Indemnification.\n')

# Upload it using multipart form data
print("Starting upload test...")
with open('test_sample.txt', 'rb') as f:
    file_content = f.read()
    
# Build multipart form data
boundary = '----WebKitFormBoundary'
body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="test_sample.txt"\r\n'
    f'Content-Type: text/plain\r\n\r\n'
).encode() + file_content + f'\r\n--{boundary}--\r\n'.encode()

try:
    req = urllib.request.Request(
        'http://localhost:8000/api/v1/documents/upload',
        data=body,
        headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}'
        }
    )
    print("Sending request...")
    with urllib.request.urlopen(req, timeout=10) as response:
        result = response.read().decode()
        print(f"Status: {response.status}")
        print(f"Response: {result}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} - {e.read().decode()}")
except Exception as e:
    print(f"Error: {e}")

print("Upload test complete!")

