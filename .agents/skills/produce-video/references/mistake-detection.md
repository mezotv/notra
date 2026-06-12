# Mistake & pacing detection (P2)

Input: the **working transcript** (`transcript.txt` + `transcript.words.json`) produced by `/transcribe-video` on the de-silenced video. Output: a list of flagged spans the user reviews. Each flag:

```json
{ "start": 41.2, "end": 47.8, "kind": "repeated_sentence", "excerpt": "so the way this works… so the way this works", "suggested_action": "cut", "why": "the sentence is restarted; the first attempt is incomplete" }
```

`start`/`end` are seconds (derive from `transcript.words.json` word timestamps — snap to the nearest word boundary so a cut never clips a syllable).

## Two action classes

### Mistakes → suggest CUT
- **Repeated/restated sentence:** the same sentence (or near-duplicate, >~80% token overlap) said twice in a short window. See **Which instance to cut** below — do NOT default to cutting the later mention.
- **Restarted sentence / false start:** an abandoned clause followed by a fresh start ("so if you— actually let me explain it differently").
- **Cut-off sentence + rephrase (subtle — easy to miss):** a sentence that **trails off incomplete** — it ends on a dangling article/preposition/auxiliary with no object or resolution ("do something with the… and that works now", "if I want to…", "so you can just…") — and is **immediately followed by another sentence covering the SAME point, rephrased and complete**. There is usually NO explicit restart marker ("let me redo that"), so this hides in plain sight. **Cut the cut-off attempt; keep the complete rephrase.** Detection signal: a clause whose meaning is unfinished (grammatically dangling, or the demonstrated action is never named) sitting right before a fresh attempt at the same idea.
- **Repeated concept:** the same point made twice within a short window with no new information the second time.
- **Filler run:** a dense cluster of "um / uh / like / you know" with no content.
- **Non-speech sounds (cough / sneeze / throat-clear / sniff / loud breath / stray noise):** audible sound with **no clear words** — always cut. Note: de-silence (P1) does NOT remove these (a cough is loud, so auto-editor keeps it), so they survive into the working copy and must be caught here. Detection signals: (a) the transcriber emits a bracketed/parenthetical non-speech token or `[BLANK_AUDIO]` (`[cough]`, `(sneezes)`, `(clears throat)`), or a garbled non-word; (b) `transcript.words.json` shows a multi-second gap between real words that de-silence did NOT remove — i.e. a loud non-speech event sits in that gap. When a gap is flagged, confirm it's non-speech (a sound, not just a deliberate pause) before cutting, then cut the sound's span (snap to the surrounding word boundaries so no speech is clipped).
- **Audible self-correction:** "wait, let me redo that", "scratch that", "ignore that", "let me start over" — cut from the prior sentence boundary to the restart.

### Draggy stretches → suggest SPEED-RAMP (pitch-preserved)
- Long pauses-while-typing, slow step-by-step walk-throughs, repetitive setup, or any low-information span where the words are fine but the pacing drags.
- Default ramp factor ~1.5–2×. Speech speed-ups preserve pitch (auto-editor `speed`/`--set-speed-for-range`). Prefer ramping over cutting when the content is wanted but slow.

## Which instance to cut (direction analysis — REQUIRED for every repeat)

A repeat almost always happens **because the first attempt was flawed** — the speaker fumbled it, said it incompletely, used the wrong word, trailed off, or it just didn't land, so they said it again better. So the redundant copy to remove is usually the **rough take**, which is often the EARLIER one. **Never reflexively cut the later mention.** For each detected repeat:

1. **Compare the takes on delivery quality:** completeness, correct terminology, fluency/confidence, and absence of vague trailing filler ("…you can do so like that", "…or whatever"). The take to KEEP is the clean one; the take to CUT is the flawed one.
2. **Decide the direction explicitly — before or after:**
   - If the first pass is the rough one (incomplete/fumbled) and the restatement is clean → **cut the preceding (earlier) span**, keep the later one.
   - If the first statement was clean and the later one is a throwaway tail restatement that adds nothing → **cut the later span**.
   - State the direction and the reason in the flag's `why`.
3. **Cut whole dependent clauses.** A follow-on that references the removed sentence (e.g. "and if you need them, you can do so like that" depends on the sentence naming "them") must be cut together with it, or it dangles.
4. **Completeness check on the KEPT take (critical — catches cut-off+rephrase).** After choosing what to keep, verify the kept sentence is grammatically and semantically **complete** — it names its object and finishes its thought. If the take you were about to keep itself **trails off** ("do something with the… and that works now"), it is NOT the clean version: extend the cut to remove it too, and keep the next, complete rephrase. When two+ attempts at the same idea appear in a row, keep the FIRST one that is actually complete and cut all the incomplete attempts before it.
5. **Seam check.** After the chosen cut, read the words immediately before and after the cut boundary together — they must flow as one continuous sentence/beat. If they don't, adjust the boundary to a clean sentence edge.

When the repeat is a 3rd+ standalone restatement of an already-well-stated line (pure redundancy, no better/worse take), cut whichever copy least disrupts flow — usually the standalone tail.

## Rules
- **Never auto-apply.** Detection only proposes; the user decides per span (cut / speed-ramp / leave / add their own range).
- **Conservative bias.** When unsure whether something is a mistake, flag it as `leave`-default and explain — do not suggest cutting genuine content.
- **Order flags by start time.** Present them in timeline order so the user can scrub top-to-bottom.
- Mistakes and ramps are **baked into the footage** in P2 (via `desilence.mjs`'s sibling auto-editor calls — `--cut-out` for cuts, `--set-speed-for-range` for ramps), one render per round, BEFORE the P3 final transcription, so the final word timestamps match the edited timeline.

See `framing-safe-zones.md` for how the P2 preview marks these spans visually.
