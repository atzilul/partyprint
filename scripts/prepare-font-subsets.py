from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset
import json,hashlib,importlib.metadata
out=[]
Path('app/assets/static').mkdir(parents=True,exist_ok=True)
def ranges(values):
    points=sorted(values); result=[]
    if not points:return ''
    first=last=points[0]
    for point in points[1:]:
        if point==last+1:last=point;continue
        result.append(f'U+{first:X}'+(f'-{last:X}' if last!=first else ''));first=last=point
    result.append(f'U+{first:X}'+(f'-{last:X}' if last!=first else ''))
    return ','.join(result)
he=set(range(0x590,0x600))|set(range(0xFB1D,0xFB50))|set(range(0x200C,0x2011))|{0x20AA,0x25CC}
latin=set(range(0x100))|set(range(0x300,0x370))|set(range(0x2000,0x2070))|set(range(0x20A0,0x20D0))|set(range(0x2100,0x2150))|set(range(0x2190,0x2200))|{0x131,0x152,0x153,0x2BB,0x2BC,0x2C6,0x2DA,0x2DC,0x2212,0xFEFF,0xFFFD}
for family,weights in [('assistant',[400,600,700]),('rubik',[400,600,900])]:
 for weight in weights:
    path=Path(f'public/fonts/{family}-{weight}.ttf');original=TTFont(path,recalcTimestamp=False);cmap=original.getBestCmap()
    groups={'hebrew':set(cmap)&he,'latin':(set(cmap)&latin)-he}
    groups['other']=set(cmap)-groups['hebrew']-groups['latin']
    covered=set()
    for group in ['other','latin','hebrew']:
        characters=groups[group]
        if not characters:continue
        font=TTFont(path,recalcTimestamp=False)
        options=subset.Options();options.layout_features=['*'];options.glyph_names=True;options.recalc_timestamp=False
        reducer=subset.Subsetter(options=options);reducer.populate(unicodes=characters);reducer.subset(font)
        font.flavor='woff2';temporary=Path(f'/tmp/{family}-{weight}-{group}.woff2');font.save(temporary)
        data=temporary.read_bytes();digest=hashlib.sha256(data).hexdigest()[:16];destination=Path(f'app/assets/static/{family}-{weight}-{group}.{digest}.woff2');destination.write_bytes(data)
        check=TTFont(destination);actual=check.getBestCmap()
        assert set(actual)==characters
        for point,glyph in actual.items():
            assert check['hmtx'].metrics[glyph]==original['hmtx'].metrics[cmap[point]]
        covered|=characters
        out.append({'family':family.title(),'weight':weight,'subset':group,'source':str(destination),'bytes':len(data),'unicodeRange':ranges(characters),'characters':len(characters),'glyphs':len(check.getGlyphOrder()),'advanceWidthsPreserved':True})
    assert covered==set(cmap)
report={'fonttools':importlib.metadata.version('fonttools'),'coverage':'union of disjoint subsets equals the complete original Unicode cmap; original advance widths retained','faces':out}
Path('docs/performance').mkdir(parents=True,exist_ok=True)
Path('docs/performance/font-subsets.json').write_text(json.dumps(report,indent=2)+'\n')
print('FONT_SUBSETS '+json.dumps(out))
