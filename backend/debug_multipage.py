import httpx
import json
import re

url = 'https://docs.google.com/forms/d/e/1FAIpQLSfd64Tm68slaZlI4y3B8yfBd592umQnYsTuVsDDWRjChKXn_w/viewform'

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

with httpx.Client(http2=True, follow_redirects=True, timeout=20) as client:
    resp = client.get(url, headers=headers)
    html = resp.text

# Extract FB_PUBLIC_LOAD_DATA
match = re.search(r'FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.+?\]);\s*</script>', html, re.DOTALL)
if match:
    data = json.loads(match.group(1))
    print(f"Top-level items: {len(data)}")
    print(f"\ndata[1] type: {type(data[1])}")
    if isinstance(data[1], list):
        print(f"data[1] length: {len(data[1])}")
        if len(data[1]) > 1:
            items = data[1][1]
            print(f"\nTotal items (questions + page breaks): {len(items)}")
            print("\nItem types (index: type_int):")
            for i, item in enumerate(items[:20]):  # First 20
                if isinstance(item, list) and len(item) > 3:
                    type_int = item[3]
                    text = item[1][:50] if len(item) > 1 and item[1] else "N/A"
                    print(f"  {i}: type={type_int} | {text}")
else:
    print("FB_PUBLIC_LOAD_DATA not found")
