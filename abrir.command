#!/bin/bash
# Abre a apresentação num servidor local (Ctrl+C no Terminal para encerrar)
cd "$(dirname "$0")"
(sleep 1 && open "http://localhost:8766/#1") &
python3 -m http.server 8766
