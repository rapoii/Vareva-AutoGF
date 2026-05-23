"""Debug AI persona generation"""
import json
from app.core.parser import parse_form_with_analysis
from app.core.generator import _make_client
from app.config import get_settings

url = 'https://docs.google.com/forms/d/e/1FAIpQLSfd64Tm68slaZlI4y3B8yfBd592umQnYsTuVsDDWRjChKXn_w/viewform'
schema, analysis = parse_form_with_analysis(url)

settings = get_settings()
client = _make_client()

prompt = (
    "Kamu adalah generator profil orang Indonesia yang realistis.\n"
    "Buat 1 profil persona berbeda yang akan mengisi sebuah Google Form.\n\n"
    "INSTRUKSI PENTING:\n"
    "- Gunakan nama Indonesia yang realistis\n"
    "- Usia antara 17-55 tahun\n"
    "- Kota dari berbagai daerah Indonesia\n"
    "- Pekerjaan yang nyata dan spesifik\n\n"
    "Return sebuah JSON object dengan key 'personas' berisi array of exactly 1 objects.\n"
    "Setiap object harus memiliki field: name, age, gender, city, occupation, education, interests, daily_habits, personality_tone, motivation\n"
    "Return ONLY the JSON, no explanation."
)

print("Prompt:", prompt[:200], "...")
print()

response = client.chat.completions.create(
    model=settings.openrouter_model,
    messages=[{"role": "user", "content": prompt}],
    response_format={"type": "json_object"},
    temperature=1.1,
)

raw = response.choices[0].message.content or "{}"
print("Raw response:")
print(raw)
print()

data = json.loads(raw)
print("Parsed data:")
print(json.dumps(data, indent=2, ensure_ascii=False))
