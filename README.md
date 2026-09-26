# Doom's Adventure

A kid-friendly 3D browser adventure starring **Doom**, who evolves into **Shadow Stalker** while battling ghostly enemies called **Ghastlies**.

## Play
Open `index.html` through a local web server, or deploy the repository as a static site.

## Controls
- **WASD / Arrow keys** — move
- **Space** — fire a Doom Orb
- **Shift** — dash
- **E** — Shadow Burst (after evolving)
- **R** — restart after winning or losing
- Touch controls appear automatically on phones and tablets.

## Goal
Defeat 8 Ghastlies, collect their red shadow energy, evolve into Shadow Stalker, then defeat the Ancient Ghastly at the ruined gate.

## itch.io build
Every push to `main` creates an `evolvedoomsadventure-html5.zip` artifact in GitHub Actions. It contains `index.html` at the root and is ready for itch.io's HTML5 uploader.

The game loads Three.js from jsDelivr, so an internet connection is still required when launching it locally. No local web server is required.

## Automatic itch.io publishing
The repository also includes a manual GitHub Action called **Publish to itch.io**.

Before using it:
1. Create an itch.io project for the game.
2. In GitHub, add repository variables:
   - `ITCH_USER` = your itch.io username
   - `ITCH_GAME` = the itch.io game slug
3. Add a repository secret:
   - `BUTLER_API_KEY` = your itch.io API key
4. Run **Actions → Publish to itch.io → Run workflow**.

The workflow uploads the browser build to the `html5` channel.

## Character
Doom and Shadow Stalker are original characters created by the developer's child.
