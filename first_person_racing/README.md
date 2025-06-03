# First Person Racing Game

This project contains a simple first‑person racing game built with [Three.js](https://threejs.org/). The track is now a closed loop inspired by Formula 1 circuits and includes basic engine sounds.

## Requirements

- A modern web browser (tested with Chrome and Firefox).
- Internet connection to load the Three.js library from a CDN.

## Running the Game

1. Open a terminal and navigate to this directory:
   ```bash
   cd first_person_racing
   ```
2. Start a local web server (optional but recommended):
   ```bash
   python3 -m http.server 8000
   ```
   Then open your browser at `http://localhost:8000/index.html`.
   
   *Alternatively*, you can simply open `index.html` directly in your browser, but a local server avoids potential cross‑origin issues.

## Controls

- **W** or **Up Arrow** – Accelerate
- **S** or **Down Arrow** – Brake/Reverse
- **A** or **Left Arrow** – Steer left
- **D** or **Right Arrow** – Steer right

The HUD in the top‑left corner displays your current speed and completed lap count. Audio will start once you press any control key.
