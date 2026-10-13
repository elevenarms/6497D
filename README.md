# Assembling the 6497

An interactive WebGL assembly of the ETA 6497 hand-wound movement, styled as a two-page spread from a classic watchmaking treatise.

**Live:** https://elevenarms.github.io/eta-6497-assembly/

![The running movement in exploded side view: screws above the bridges, the train under them, the brass plate, and the motion work and hands below(docs/screenshot.jpeg)

## Run locally

```sh
cd watch-game
python3 -m http.server 8497   # or: npx serve
# open http://127.0.0.1:8497/
```

It must be served over HTTP, because the model is fetched. Three.js 0.170 loads from jsDelivr.

## Play

- Choose the next component from the **List of Components**, move it over its shadowed place on the figure, and click to set it down. **Enter** sets the held part for you, and **Esc** puts it back.
- Choosing a part out of order counts as a fault. The order is ETA's (CT 6497-2, *Order of assembly*), in six stages: keyless work, yoke and setting wheels, going train, barrel and winding wheels, escapement, motion work. The movement turns over automatically when the work changes sides.
- **Automatic Assembly** builds the movement in the maker's order, and you can pause it to carry on by hand.
- **Assemble & Run the Watch** assembles whatever is still missing, winds the mainspring and sets the watch going.
- Once the movement is complete, you can **Wind** it, **Pull Crown** and then **Turn Crown** to set the hands, show or hide the **Hands**, toggle the **Sound** of the beat, and choose a speed of ×1, ×10, ×60 or ×3600.
- The view tools are **Turn over**, **Exploded** and **Reset view**. The movement is drawn as an engraved plate, in ink line over a pale wash of each part's metal: brass plate, rhodium bridges, gilt wheels, steel, blued screws and ruby jewels.
- **Music** plays a Mozart string quartet movement. It is on by default and starts with your first click.

## How it is built

- `assets/movement.bin` and `assets/movement.json` come from `ETA 6497-1 Movement Corrected.STEP`. The tools in `tools/` produce them: `tessellate-step.mjs` runs occt-import-js and writes `result.json`, and `pack-meshes.mjs` packs the meshes as Uint16 positions, Int8 normals and per-mesh indices. The STEP assembly tree gives one mesh group per named part.
- `js/parts.js` holds the assembly order, ETA position numbers, torques, lubricants, arbor positions and instruction text.
- `js/main.js` contains the scene, interaction, escapement and train kinematics, and the UI. The balance swings at 3 Hz with a 44° lift angle. The escape wheel advances 12° per beat inside the lift zone, and the train, the hands and the 56-hour power reserve all follow from those steps.

## Credits

- **Movement model:** *ETA 6497-1 complete watch movement*, a community model from [GrabCAD](https://grabcad.com/). The meshes in `assets/` were tessellated from its STEP file, and the model remains subject to the GrabCAD terms of use.
- **Technical data:** ETA SA, *Technical Communication* CT 6497-2 and *Manufacturing Information* IH 6497-2, the sources for the order of assembly, torques, lubricants, frequency, lift angle and power reserve. The PDFs themselves are not included.
- **Music:** W. A. Mozart, String Quartet No. 19 in C major, K. 465 "Dissonance", II. *Andante cantabile*, played by the Musopen String Quartet. The recording is public domain, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Mozart_-_String_Quartet_No._19_in_C_major,_K465_%27Dissonance%27_-_II._Andante_cantabile_(Musopen_String_Quartet).flac), re-encoded as 32 kbps mono AAC.
- **Typography and style:** [EB Garamond](https://fonts.google.com/specimen/EB+Garamond) by Georg Duffner and Octavio Pardo. The page design is a homage to George Daniels' *Watchmaking* (1981).
- **Rendering:** [three.js](https://threejs.org/). STEP tessellation uses [occt-import-js](https://github.com/kovacsv/occt-import-js) (Open CASCADE).

This project is not affiliated with ETA SA, the Swatch Group or the estate of George Daniels.

## License

The code in this repository is released under the [MIT License](LICENSE). Third-party material keeps its own terms: the movement meshes in `assets/` (derived from the GrabCAD model), the Mozart recording (public domain) and the EB Garamond font (SIL Open Font License, loaded from Google Fonts).
