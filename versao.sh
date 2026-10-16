#!/bin/bash
# Atualiza o número de versão dos CSS/JS no index.html (evita o navegador usar arquivo antigo do cache).
# Rode antes de cada commit: ./versao.sh
cd "$(dirname "$0")"
v=$(date +%Y%m%d%H%M%S)
python3 - "$v" <<'PY'
import re, sys
v = sys.argv[1]
s = open('index.html').read()
s = re.sub(r'((?:href|src)="(?:css|js|fonts|vendor)/[^"?]+\.(?:css|js))(?:\?v=\d+)?"', lambda m: f'{m.group(1)}?v={v}"', s)
open('index.html', 'w').write(s)
PY
echo "versão $v"
