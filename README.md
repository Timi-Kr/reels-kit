# Reels kit: viral edit s Claudeom

Claude odlučuje kako će edit izgledati, a **Remotion** ga renderira. Ti mu daješ raw video i ukus, a on reže, piše titlove, radi animacije i sound design.
U repou su Remotion studio i dva skilla (`.claude/skills/`) koji rade čim otvoriš ovaj folder u Claude Codeu.

## 0 · Instalacija u jednom promptu (najlakše)

Prvo prihvati GitHub pozivnicu za ovaj repo iz maila. Zatim otvori Claude desktop app → **Code**, odaberi bilo koji folder i zalijepi:

```text
Postavi mi Reels kit za editiranje videa. Napravi redom, bez preskakanja:
1. Provjeri jesam li prijavljen na GitHub (gh auth status). Ako gh ne postoji, instaliraj ga preko Homebrewa (a Homebrew s brew.sh ako ga nemam). Ako nisam prijavljen, pokreni gh auth login i vodi me kroz prijavu.
2. Kloniraj Timi-Kr/reels-kit u moj Documents folder. Ako dobiješ "not found", reci mi da prvo prihvatim GitHub pozivnicu iz maila.
3. Instaliraj što fali (node, ffmpeg, python) preko brewa, pa u reels-kit folderu pokreni ./setup.sh i pričekaj da završi.
4. Na kraju mi reci da otvorim novu sesiju u folderu Documents/reels-kit i tamo napišem: "Napravi viral edit od ovog videa".
```

Traje ~10 min (skida se whisper model od ~1.6 GB), pa to napravi **prije workshopa**. Ako radije sam pokrećeš naredbe, slijedi korak 1.

## 1 · Setup ručno (jednom, oko 10 min)

Treba ti Mac s [Homebrewom](https://brew.sh). Ako nešto od ovoga nemaš, instaliraj:

```bash
brew install node ffmpeg python
```

Zatim u ovom folderu pokreni:

```bash
./setup.sh
```

Skripta instalira Remotion, napravi Python okruženje, skine whisper model (~1.6 GB) i za provjeru renderira jedan frame.
**Napravi to prije workshopa** jer model treba vremena za skidanje.

Na kraju otvori ovaj folder u Claude Codeu (desktop app → Code → odaberi folder). Postavke: **Opus, high effort**.

## 2 · Edit: Claude te sam vodi

Napiši jednu rečenicu i povuci video u chat:
> Napravi viral edit od ovog videa.

Claude te dalje vodi kroz 5 koraka: **1 Rezanje → 2 Plan → 3 Animacije → 4 Zvuk → 5 Final**.
Nakon svakog koraka pokaže rezultat i pita što dalje, a ti samo klikneš odgovor ili napišeš izmjenu. Ništa ne ide dalje bez tvog OK-a.

- **Plan** je jedini korak gdje radiš sam (≈15 min). Otvori se stranica gdje za svaku rečenicu biraš vrstu scene, pozadinu (ili *Auto*) i upišeš što se događa. Ako ti se ne da, klikni *Predloži ti plan* i Claude složi prijedlog.
- **Izmjene** pišeš normalno, npr. "drugu scenu napravi tamnom, a broj neka bude veći".
- **Nastavak kasnije:** napiši *"nastavi <ime projekta>"* i Claude sam nađe gdje ste stali.
- **Strogi pregled:** nakon drafta klikni *Strogi pregled* i drugi Claude (kritičar) ocijeni video od 1 do 10 po 8 kriterija i popravi 3 najveća problema. Traje ~5 min, pa ga koristi za važne videe.
- **Bez pitanja:** *"napravi sve sam"* znači da Claude ide sam do drafta i tamo stane da pogledaš.

## 3 · Što je gdje

| | |
|---|---|
| `public/projects/<ime>/` | tvoj projekt: raw, cut, transkript, plan, `edit.json` |
| `src/projects/<ime>/` | kod scena za taj projekt (sam se registrira) |
| `src/components/glow.tsx` | UI elementi sa svjetlom: kartice, brojke, grafovi, prstenovi, notifikacije, prompt bar… |
| `public/sfx/` | zvukovi: `pack/` (pravi, prvi izbor) i sintetizirani (rezerva) |
| `.claude/skills/` | upute koje Claude prati (stil, pravila, skripte) |
| `out/` | renderi i stillovi |

Ručni pregled:

```bash
npx remotion studio
```

Tu biraš kompoziciju `Edit` s props `{"slug":"<ime>"}`. Kompozicija **`UIKit`** pokazuje sve UI elemente koje Claude može koristiti.

Primjer projekta je `demo`. Tvoji projekti i snimke ostaju samo na tvom laptopu (`.gitignore`), u git ide samo `demo`.

## 4 · Kad nešto ne radi

- **"Version mismatch" upozorenje** koje pokazuje na `node_modules` izvan ovog foldera: obriši taj vanjski `node_modules`, jer nema veze s kitom.
- **Transkripcija je spora**: prvi put skida model. Za 1 min videa normalno je 1–3 min na M-čipu.
- **Font izgleda krivo**: script font je Cormorant Garamond (besplatan). Možeš izabrati drugi u planning pageu.
- **Ažuriranje kita**: `git pull`, pa `npm ci` ako se promijenio `package.json`.
