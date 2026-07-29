SAANKET — ISL Dataset Plan (Day 1 Deliverable)
Target-----

100+ ISL sign classes, sourced through a mix of self-recording and existing government/academic datasets — not 100 self-recorded from scratch, to stay realistic within 45 days.

Samples per class---
Target: 20–25 raw samples per class at minimum, before augmentation
Augmentation (mirror + speed-jitter, per handbook Day 26) will multiply effective samples later — this is the fallback if raw sample count runs short, not a substitute for it early on

Sourcing strategy (mixed, to move faster than pure self-recording)---

Source-
 Self-recorded (you + teammates)
 ISLRTC official dictionary
 INCLUDE dataset (AI4Bharat/IIIT-B)
Role-
 Bulk of samples, ensures variation across signers
 Ground-truth reference signs, especially medical/emergency terms
 Additional real-signer samples per word where overlap exists
Notes-
 Record in small batches per day, not all at once
 Already confirmed accessible; use for reference + as one clean sample per word
 Check word overlap with your list before relying on it

Vocabulary — 100 words across 6 categories---

(Adjust/swap words once you cross-check against what's actually available in ISLRTC/INCLUDE — don't force a word if no clean reference exists for it.)

Greetings & courtesy (10): hello, goodbye, thank you, please, sorry, yes, no, welcome, good morning, good night

Emergency & medical (20): help, pain, doctor, nurse, hospital, medicine, emergency, injury, fever, blood, ambulance, sick, injection, allergy, breathe, dizzy, bleeding, accident, unconscious, call

Daily needs (20): water, food, hungry, thirsty, bathroom, sleep, tired, cold, hot, home, money, phone, time, today, tomorrow, wait, come, go, stop, sit

People & relations (10): mother, father, friend, family, brother, sister, teacher, doctor (repeat check), child, name

Numbers (10): one, two, three, four, five, six, seven, eight, nine, ten

Common verbs/questions (30): what, where, who, why, how, when, understand, know, want, need, can, cannot, good, bad, happy, sad, angry, scared, love, like, work, study, play, eat, drink, walk, sit, stand, open, close

(Total: 100 — trim or expand slightly once cross-checked against available reference clips; this list is a starting point, not fixed in stone.)

Recording rules (applies to every self-recorded sample)---

Camera: laptop/phone webcam, minimum 720p, steady (use a stand/support, not handheld)
Distance: upper body + both hands fully visible in frame at all times
Background: plain, non-cluttered, consistent lighting (avoid backlighting/windows behind you)
Signer variation: record with at least 2 different people if possible (you + 1 teammate/friend) — improves model generalization, matches handbook's "user variation" robustness testing later (Day 31)
Sample variation per class: vary hand speed and slightly vary starting hand position across the 20–25 samples of the same word — avoids the model memorizing one exact motion
File naming convention: <word>_<signerID>_<sampleNumber>.mp4 (e.g. help_gargi_01.mp4) — keeps your dataset organized and traceableAlready confirmed accessible;