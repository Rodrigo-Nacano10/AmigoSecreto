# Monta public/index.html a partir de src/ (rode: python3 build.py)
import pathlib
r=pathlib.Path(__file__).parent
js='\n'.join((r/'src'/f).read_text() for f in ['app-helpers.js','app-core.js','app-effects.js','app-ui.js'])
t=(r/'src/index.template.html').read_text()
t=t.replace('{{CSS}}',(r/'src/base.css').read_text()).replace('{{HEADER}}',(r/'src/header.html').read_text()).replace('{{APP_JS}}',js)
(r/'public/index.html').write_text(t); print('public/index.html ok')
