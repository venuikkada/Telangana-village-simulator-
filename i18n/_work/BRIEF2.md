# Translate the game "Indian Village Simulator"

A free 3D farming game set in an Indian village (Ramapuram, Telangana), played by kids and adults all over India on phones and computers. Translate every on-screen line from English into ONE language.

IMPORTANT, to save time and cost: read ONLY this file and `src.txt` in this folder. Do NOT open the game's source code or any other file, and do not explore the repository.

Folder: `/tmp/claude-0/-home-claude-telangana-village-simulator-/dd28a9d7-aa98-540c-8a92-6ab09e03210f/scratchpad/i18n/`

## Input: src.txt
- `## file — context` lines tell you where the next lines appear (menus, missions, instructions, names...).
- Every other line is `N|English text`. A few fragment lines end with `⟪te: …⟫`, the Telugu version, only as a hint for meaning.
- `␣` at the very start or end of a text marks a space there (the piece is joined to other text, e.g. `␣L` = " lakh" after an amount, `Field␣` before a number).

## Output: part files in out/
Write the translation as several small files in `out/`: `<code>.p01.txt`, `<code>.p02.txt`, `<code>.p03.txt`, … Each holds about 200 lines in the form `N|translation` (p01 = lines 1–200, p02 = 201–400, and so on), same numbers as the input. One Write call per part file, never more than ~220 lines in one Write. No `##` lines, no JSON, no quotes, no notes.

When all parts are written, run:

`node /tmp/claude-0/-home-claude-telangana-village-simulator-/dd28a9d7-aa98-540c-8a92-6ab09e03210f/scratchpad/i18n/check2.cjs <code>`

If it reports missing or mismatched lines, write ONE more small file `out/<code>.p99.txt` containing only those lines (corrected), and run the check again. Finish when it prints ALL GOOD.

## Rules
1. `{0}`, `{1}` … are values (numbers, ₹ amounts, names, places, crops, days). Keep exactly the same set in each line; move them where your grammar needs; never translate or renumber them.
2. Keep `␣` at the start/end where the English has it.
3. Keep ₹ % → · — “ ” ( ) × ★ ✓ ▶ ■ ❓ emoji and digits. Keep keys as they are: E, F, B, M, P, G, H, L, V, Q, Esc, Enter, Shift, Space, Tab, W A S D, 1–6.
4. Simple everyday spoken language a village child or farmer understands; not formal or literary. Everyday English loanwords (tractor, pump, borewell, bus, auto, bank, loan, shop) may stay, written in your script.
5. Short! Buttons and cards are small: about as long as the English or shorter. One-word buttons stay one word.
6. People and places (Raju, Radha, Srinu, Bhaskar, Hanmanthu, Lakshmi, Ramapuram, Seethampet, Nagaram, Pedda Cheruvu) and festivals (Bonalu, Bathukamma, Sankranti, Ugadi, Dasara, Diwali): write by sound in your script.
7. Seasons: "Vanakalam (Kharif)" = monsoon/Kharif season, "Yasangi (Rabi)" = winter/Rabi season, "Endakalam (Summer)" = summer season (use your usual words).
8. Units: q = quintal, ac = acre, L after litres = litre, ␣L after ₹ = lakh, Cr = crore, h = hours, m = metres. MSP stays MSP. santha = weekly village market, kirana = small grocery shop, sarpanch = village head, dhaba = roadside eatery, Jonna rotte = jowar roti, majjiga = buttermilk.
9. Consistency: these are button names and must be the same everywhere, also inside sentences ("Hold Work…", "Tap Use…"): Work, Use, Run, Jump, View, Type, Map, Farm office, Menu, Photo, Storage, Missions, Trophies, Profile, Rest, Auto, How?, Do it for me, Daily gift.
10. Fragments are joined with other text; make the joined sentence read naturally.
11. Happy words (Shabash!, Super!, Amazing!, Well done!) should sound cheerful and natural.

Reply at the end with just the check output line.
