import sys, json
from pypdf import PdfReader

r = PdfReader(sys.argv[1])
dests = {}
for name, d in r.named_destinations.items():
    try:
        dests[str(name).lstrip('/')] = r.get_destination_page_number(d) + 1
    except Exception:
        pass
# fallback: link annotations with explicit /Dest arrays are not needed for Chrome output
print(json.dumps({'pages': len(r.pages), 'dests': dests}, ensure_ascii=False))
