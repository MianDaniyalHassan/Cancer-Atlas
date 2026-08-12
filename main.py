import os
import sys
import time
import json
import shutil
import importlib.util
import threading
import subprocess
import webbrowser
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"

BACKEND_HEALTH = "http://127.0.0.1:8000/health"
FRONTEND_URL = "http://localhost:3000"

IS_WINDOWS = os.name == "nt"
NEW_GROUP = subprocess.CREATE_NEW_PROCESS_GROUP if IS_WINDOWS else 0


def npm(*args):
    return ["cmd", "/c", "npm", *args] if IS_WINDOWS else ["npm", *args]


def stream(proc, tag):
    if proc.stdout is None:
        return
    for line in iter(proc.stdout.readline, ""):
        if not line:
            break
        sys.stdout.write(f"[{tag}] {line}")
        sys.stdout.flush()


def wait_for(url, timeout):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                if resp.status < 500:
                    return True
        except Exception:
            time.sleep(1)
    return False


def stop(proc):
    if proc is None or proc.poll() is not None:
        return
    try:
        if IS_WINDOWS:
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        else:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
    except Exception:
        pass


def spawn(argv, cwd, tag, env=None):
    proc = subprocess.Popen(
        argv,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        creationflags=NEW_GROUP,
        env=env,
    )
    threading.Thread(target=stream, args=(proc, tag), daemon=True).start()
    return proc


def embedding_model_cached():
    hf_home = os.environ.get("HF_HOME")
    hub = Path(hf_home) / "hub" if hf_home else Path.home() / ".cache" / "huggingface" / "hub"
    return (hub / "models--sentence-transformers--all-MiniLM-L6-v2").exists()


def backend_env():
    env = os.environ.copy()
    if embedding_model_cached():
        env["HF_HUB_OFFLINE"] = "1"
        env["TRANSFORMERS_OFFLINE"] = "1"
    return env


def warm(label, url, method="GET", payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    try:
        request = urllib.request.Request(url, data=data, method=method)
        if data is not None:
            request.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(request, timeout=90) as resp:
            resp.read()
        print(f"[run] warmed {label}")
    except Exception:
        print(f"[run] skipped warming {label} (will load on first use)")


def opener():
    backend_up = wait_for(BACKEND_HEALTH, timeout=240)
    frontend_up = wait_for(FRONTEND_URL, timeout=240)

    if frontend_up:
        print(f"[run] Ready. Opening {FRONTEND_URL}")
        webbrowser.open(FRONTEND_URL)
    else:
        print(f"[run] Frontend not up yet — open {FRONTEND_URL} manually once it compiles.")

    print("[run] Pre-warming the chat page and API in the background...")
    if frontend_up:
        warm("chat page (frontend compile)", "http://localhost:3000/chat")
    if backend_up:
        warm("chat endpoint (backend request path)", "http://127.0.0.1:8000/chat", "POST", {"message": "hi"})
    print("[run] Warm-up done — /chat and the API are ready before you click through.")


def main():
    if not (BACKEND / "main.py").exists() or not (FRONTEND / "package.json").exists():
        sys.exit("Run this from the CancerAtlas project root (backend/ and frontend/ must exist).")
    if shutil.which("node") is None:
        sys.exit("Node.js not found on PATH. Install Node 18+ from https://nodejs.org and retry.")
    if importlib.util.find_spec("uvicorn") is None or importlib.util.find_spec("fastapi") is None:
        sys.exit(
            "Backend Python dependencies are missing for this interpreter.\n"
            f"Run:  {sys.executable} -m pip install -r backend/requirements.txt"
        )

    if not (FRONTEND / "node_modules").exists():
        print("[run] Installing frontend dependencies (first run only)...")
        if subprocess.run(npm("install"), cwd=FRONTEND).returncode != 0:
            sys.exit("npm install failed — fix the error above and retry.")

    if embedding_model_cached():
        print("[run] Starting backend (:8000) and frontend (:3000). Embedding model is cached — loading it offline from disk.")
    else:
        print("[run] Starting backend (:8000) and frontend (:3000). First run downloads the embedding model (~90MB) once, then caches it forever.")

    backend = spawn([sys.executable, "main.py"], BACKEND, "backend", env=backend_env())
    frontend = spawn(npm("run", "dev"), FRONTEND, "frontend")
    procs = [backend, frontend]

    threading.Thread(target=opener, daemon=True).start()

    print("[run] Press Ctrl+C to stop both servers.\n")

    try:
        while True:
            for proc in procs:
                if proc.poll() is not None:
                    raise KeyboardInterrupt
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n[run] Stopping servers...")
    finally:
        for proc in procs:
            stop(proc)
        print("[run] Done.")


if __name__ == "__main__":
    main()
