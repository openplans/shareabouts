#!/usr/bin/env python3

import sys
import re

for line in sys.stdin:
    line = line.strip()
    if not line or line.startswith('#'):
        continue

    key, val = line.split('=', maxsplit=1)

    if val.lower() in ('true', 'false'):
        val = f'"{val}"'

    if re.match(r'\d{4}-\d{2}-\d{2}', val):
        val = f'"{val}"'

    sys.stdout.write(f'{key}: {val}\n')
