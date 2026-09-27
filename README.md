# Doom's Adventure

A kid-friendly 3D browser action-adventure starring **Doom**, who evolves into **Shadow Stalker** while battling ghost enemies called **Ghastlies**.

This prototype is built around the original Doom / Shadow Stalker character art. Doom, Shadow Stalker, and the Ghastlies are now real lightweight 3D characters assembled from stylized low-poly meshes, with toon shading and emissive red magic so the browser build stays close to the reference artwork while remaining fast enough for iPad.

## Current playable prototype

- Third-person 3D island level with a clear path to the Shadow Gate
- Fully 3D Doom with giant ears, glowing red markings, red eyes, claws, tail, and floating magic orbs
- Fully 3D Shadow Stalker evolution with larger body, horns, jagged glowing mouth, claws, arrow tail, and overhead orbs
- Fully 3D **grey** hooded Ghastlies with smoky tails, claws, glowing eyes, and floating animation so they read clearly apart from Doom and Shadow Stalker
- Five enemy classes introduced over the campaign: **Drifter** (Level 1), **Charger** (10), **Brute** (20), **Hexer** (30), and **Reaper** (40)
- Later Ghastlies have more health and new behaviours: charges, heavy melee attacks, ranged magic, and faster elite movement
- **50 playable adventure levels**: each starts at a different edge of the island and ends by reaching an exit portal
- Ghastlies use limited encounters in Levels 1–10 and continuously respawn in later prototype levels
- Exploration objectives rotate between finding lost relics, awakening rune stones, discovering forgotten landmarks, and finding a portal key
- Optional treasure chests are hidden away from the direct route and restore health
- **Boss battles every 10 levels**, starting with the Leaf Guardian; defeating the boss unlocks that level's portal
- Doom remains Doom through Levels 1–29 and evolves into **Shadow Stalker during the Level 30 boss encounter**
- Shadow Stalker gains a close-range **Shadow Burst**
- Ancient Ghastly boss fight at the Shadow Gate
- Auto-aimed orb attacks to make the game friendlier for kids
- Touch-first iPad controls plus keyboard controls
- Responsive HUD, iPad safe-area support, and landscape orientation guidance
- Reduced render resolution and particle budget on touch devices for smoother iPad performance
- Procedural sound effects; no sound files required

## Play locally

Download or clone the repository and **double-click `index.html`**.

Three.js is bundled under `vendor/`, so this build no longer needs an internet connection to start locally.

For iPad, the easiest way to play is the itch.io HTML5 build in Safari. Landscape orientation is recommended.

## Controls

### iPad / touch
- Left virtual joystick — move
- Large red **ORB** button — fire at the nearest Ghastly
- **DASH** — quick burst of speed and brief invulnerability
- **BURST** — unlocked after evolving into Shadow Stalker

### Keyboard
- **WASD / Arrow keys** — move
- **Space** — Doom Orb
- **Shift** — dash
- **E** — Shadow Burst after evolving
- **R** — restart after winning or losing

## Goal

Travel through all **50 levels** by exploring each area, completing its adventure objective, and then reaching the newly opened portal. Ghastlies keep appearing while Doom explores, so the player can choose when to fight and when to keep moving. Every **10th level is a boss adventure**: defeat the Ancient Ghastly to unlock the portal. Doom evolves into **Shadow Stalker halfway through the Level 30 boss encounter**. Level 50 ends after the final boss is defeated and Shadow Stalker crosses the last portal.

## itch.io build

Every push to `main` creates an `evolvedoomsadventure-html5.zip` artifact in GitHub Actions. The zip contains `index.html`, the character assets, and the bundled Three.js runtime.

The repository also includes an automatic **Publish to itch.io** workflow triggered by pushes to `main`, with a manual option. Configure these GitHub repository settings first:

- Variable `ITCH_USER` — itch.io username
- Variable `ITCH_GAME` — itch.io game slug
- Secret `BUTLER_API_KEY` — itch.io API key

Then push to `main`, or run **Actions → Publish to itch.io → Run workflow**. See the detailed one-time setup below.

## Art direction

The target is a bright, polished, family-friendly fantasy adventure. Doom and Shadow Stalker keep the dark charcoal-and-red visual language of the reference art, while Ghastlies now use grey/silver bodies and distinct eye colours so enemies are immediately readable. The current character models are intentionally simple procedural low-poly builds rather than final production assets, but they are genuine 3D models designed to stay lightweight on iPad.

## Story chapter update

The first ten levels now form **Whispering Woods**, with a skippable 20-second opening scene, named adventures, authored objective placements, forest groves and tree collisions. These levels use limited encounters instead of continuous enemy respawning. Level 10 introduces the **Leaf Guardian**, with a warned root slam, leaf projectiles and an exposed-heart attack window. Levels 11–50 retain the existing prototype adventures and bosses; the remaining proposed bespoke chapters are future work.

New Adventure / Continue and Pause / Retry menus support touch controls. Progress saves at the **start of each level**, on the same browser and device; it is not a cloud save. Clearing browser data removes it, and browser storage restrictions may prevent saving. The game still runs when saving is unavailable. Evolution now happens halfway through the Level 30 boss encounter; continuing beyond Level 30 restores Shadow Stalker.

Run the gameplay regression checks with Node.js:

```sh
node --check game.js
node tests/story.test.cjs
```

The tests use the actual Three.js scene code with a stub renderer. They cover save preservation, story skipping, retrying, forest objectives, Leaf Guardian timing, evolution and unavailable storage. Rendering and touch responsiveness still need an iPad Safari playtest through itch.io.

## Automatic itch.io publishing setup

`Publish to itch.io` now runs automatically on every push to `main`, and can also be run manually. It checks JavaScript syntax and runs gameplay tests before uploading the HTML5 folder through Butler. The separate build workflow still provides a downloadable ZIP as a backup.

One-time setup:

1. In this GitHub repository, open **Settings → Secrets and variables → Actions**.
2. Under **Variables**, set `ITCH_USER` to your itch.io username and `ITCH_GAME` to the game slug (the part after the slash in `username.itch.io/game-slug`).
3. Under **Secrets**, add `BUTLER_API_KEY` using your Butler/itch.io API key. Do not put the key in source files or chat. See [Butler authentication](https://itch.io/docs/butler/login.html).
4. Push these changes to `main`, or run **Actions → Publish to itch.io → Run workflow** after they are on GitHub.
5. After the first Butler upload, open the itch.io game's **Edit game** page. Set its kind to **HTML**, and mark the `html5` channel upload as **This file will be played in the browser**. Save the page. If the old manually uploaded ZIP is still selected, switch the playable selection to the Butler upload. See [Butler HTML5 setup](https://itch.io/docs/butler/pushing.html#html-playable-in-browser-games).
6. Enable **Mobile friendly** in itch.io's embed options, and test on iPad in landscape. See [HTML5 game settings](https://itch.io/docs/creators/html5).

Subsequent successful pushes update the same `html5` upload; no manual ZIP publishing is needed. Reopen or reload the game on the iPad to load the new version. A failed workflow leaves the previous published build available. These local changes do not configure GitHub secrets or publish a build by themselves.

## Larger procedural levels and character models

Levels now generate a seeded world approximately 150–170 game units across, with winding routes, side paths to treasure, objective clearings, ruins, distant hills, and reserved boss arenas. The same level number produces the same map, so a retry remains learnable while later levels vary. A portal distance indicator helps on iPad. The cutscene starts in a reserved clearing, and trees between the camera and Doom are temporarily hidden to keep the action readable.

Doom and Shadow Stalker are authored Blender meshes based on `reference/character_concepts.jpg`, with swept ears, crimson inner-ear markings, ruby eyes, forehead markings, claws, tails, and magic orbs. Editable source files are in [art/characters](D:/Work/Kids/evolvedoomsadventure/art/characters); runtime GLB exports and browser mesh buffers are in [assets/characters](D:/Work/Kids/evolvedoomsadventure/assets/characters). To regenerate them after an art edit, run Blender 4.5 with [tools/build_characters.py](D:/Work/Kids/evolvedoomsadventure/tools/build_characters.py).

Drag on the game view to orbit the third-person camera. This works with a mouse or a finger on iPad; the joystick and action buttons remain independent. Doom and Shadow Stalker now move at 1.5× their previous walking speed.

Forest generation uses four instanced tree silhouettes—broadleaf, pine, willow, and crystal—with independent seeded height and canopy scale. This keeps the larger maps efficient while making the horizon and landmarks change between levels.

Every generated objective and portal is a checkpoint in the route graph. Dirt strips are built between each checkpoint, and tree placement reserves a corridor around those strips, so the main path remains readable even in the larger maps. The POWER move now projects a bright expanding shockwave ring sized to its damage radius.

Hold **Shift** or the **SPRINT** button to run faster. **E** or the **POWER** button triggers a stronger area attack for both forms; its radial cooldown is shown on the button.
