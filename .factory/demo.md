# Demo sandbox

Open `/demo` or run `terminal-recall demo`.

The website demo loads one deploy record with a realistic key-shaped value. It is
stored only under `demo:terminal-recall:logs`; real records use
`terminal-recall:logs`. **Reset demo** removes that demo key. **Start for real**
also removes the demo key before returning home.

The CLI demo creates a fresh temporary encrypted store, searches the sample
output, and prints the path to a redacted text export. The shipped input is
`examples/deploy-check.txt`.
