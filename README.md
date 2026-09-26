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
- **50 playable levels** with gradually larger and tougher Ghastly waves
- Doom remains Doom through Levels 1–29 and evolves into **Shadow Stalker at Level 30**
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

Fight through all **50 levels**. New Ghastly types appear every ten levels and the atmosphere changes as Doom approaches the Shadow Gate. Doom evolves into **Shadow Stalker when Level 30 begins**. Level 50 is the final battle against the **Ancient Ghastly** and its guardians.

## itch.io build

Every push to `main` creates an `evolvedoomsadventure-html5.zip` artifact in GitHub Actions. The zip contains `index.html`, the character assets, and the bundled Three.js runtime.

The repository also includes a manual **Publish to itch.io** workflow. Configure these GitHub repository settings first:

- Variable `ITCH_USER` — itch.io username
- Variable `ITCH_GAME` — itch.io game slug
- Secret `BUTLER_API_KEY` — itch.io API key

Then run **Actions → Publish to itch.io → Run workflow**.

## Art direction

The target is a bright, polished, family-friendly fantasy adventure. Doom and Shadow Stalker keep the dark charcoal-and-red visual language of the reference art, while Ghastlies now use grey/silver bodies and distinct eye colours so enemies are immediately readable. The current character models are intentionally simple procedural low-poly builds rather than final production assets, but they are genuine 3D models designed to stay lightweight on iPad.
