# gems

Gemstone explorer — interactive web app in `gemstone-explorer/`.

## Getting Started

### Prerequisites

- **Python 3** (for a local static file server). No Node/npm required for the main app.

### Run the app

From the repository root:

```bash
cd gemstone-explorer
python3 -m http.server 8080
```

Then open **[http://127.0.0.1:8080/](http://127.0.0.1:8080/)** in your browser. That serves `gemstone-explorer/index.html` and its assets.

Stop the server with **Ctrl+C** in that terminal.

### Other files

- `manual_test_instructions.html` lives at the repo root (not under `gemstone-explorer/`). Open it directly in the browser (`File → Open`) or run `python3 -m http.server` from the repo root and visit the path shown in the server output.

## License

Add license information here.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
