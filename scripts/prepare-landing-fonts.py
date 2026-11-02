# Preserve glyph coverage and metrics; change container from TTF to WOFF2 only.
from pathlib import Path
from fontTools.ttLib import TTFont
import json, importlib.metadata
results=[]
for family,weights in [('assistant',[400,600,700]),('rubik',[400,600,900])]:
    for weight in weights:
        source=Path(f'public/fonts/{family}-{weight}.ttf')
        destination=source.with_suffix('.woff2')
        font=TTFont(source)
        cmap=font.getBestCmap()
        metrics=dict(font['hmtx'].metrics)
        font.flavor='woff2'
        font.save(destination)
        check=TTFont(destination)
        assert check.getBestCmap()==cmap
        assert dict(check['hmtx'].metrics)==metrics
        results.append({'source':str(source),'path':str(destination),'sourceBytes':source.stat().st_size,'bytes':destination.stat().st_size,'glyphs':len(check.getGlyphOrder()),'unicodeCodepoints':len(cmap)})
Path('public/landing/font-report.json').write_text(json.dumps({'fonttools':importlib.metadata.version('fonttools'),'fonts':results},indent=2)+'\n')
print(json.dumps(results))
