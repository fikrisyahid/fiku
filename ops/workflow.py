# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "click>=8.1.7",
#     "rich>=13.7.1",
#     "python-dotenv>=1.0.1",
# ]
# ///

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path
import click
from rich.console import Console
from rich.panel import Panel

# Pastikan UTF-8 encoding di Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

console = Console(force_terminal=True, legacy_windows=False)

ROOT_DIR = Path(__file__).resolve().parent.parent
MAIN_DIR = ROOT_DIR / "main"
OPS_DIR = ROOT_DIR / "ops"
ROOT_ENV = ROOT_DIR / ".env"
MAIN_ENV = MAIN_DIR / ".env"
ROOT_ENV_EXAMPLE = ROOT_DIR / ".env.example"
MAIN_ENV_EXAMPLE = MAIN_DIR / ".env.example"


def sync_env_files() -> None:
    """
    Sinkronisasi file .env antara root dan main/.
    Aturan:
    1. Utamakan versi terbaru di root (.env).
    2. Jika root .env ada dan lebih baru (atau main/.env belum ada), salin root -> main/.
    3. Jika main/.env lebih baru dari root, salin main -> root agar tidak kehilangan perubahan.
    4. Selalu pastikan main/.env sinkron sebelum menjalankan proses apapun.
    """
    # 1. Sync .env.example
    if ROOT_ENV_EXAMPLE.exists() and not MAIN_ENV_EXAMPLE.exists():
        shutil.copy2(ROOT_ENV_EXAMPLE, MAIN_ENV_EXAMPLE)
    elif MAIN_ENV_EXAMPLE.exists() and not ROOT_ENV_EXAMPLE.exists():
        shutil.copy2(MAIN_ENV_EXAMPLE, ROOT_ENV_EXAMPLE)

    # 2. Sync .env
    if ROOT_ENV.exists() and not MAIN_ENV.exists():
        console.print("[yellow]Menyalin .env dari root ke main/...[/yellow]")
        shutil.copy2(ROOT_ENV, MAIN_ENV)
    elif MAIN_ENV.exists() and not ROOT_ENV.exists():
        console.print("[yellow]Menyalin .env dari main/ ke root...[/yellow]")
        shutil.copy2(MAIN_ENV, ROOT_ENV)
    elif ROOT_ENV.exists() and MAIN_ENV.exists():
        root_mtime = ROOT_ENV.stat().st_mtime
        main_mtime = MAIN_ENV.stat().st_mtime

        # Jika root lebih baru atau sama (diutamakan root)
        if root_mtime >= main_mtime:
            if ROOT_ENV.read_bytes() != MAIN_ENV.read_bytes():
                shutil.copy2(ROOT_ENV, MAIN_ENV)
        else:
            # Jika main lebih baru
            if MAIN_ENV.read_bytes() != ROOT_ENV.read_bytes():
                console.print("[dim]Sinkronisasi .env: main/ lebih baru -> memperbarui root .env[/dim]")
                shutil.copy2(MAIN_ENV, ROOT_ENV)


def run_command(cmd: list[str], cwd: Path | None = None, env_extra: dict[str, str] | None = None) -> int:
    """Menjalankan perintah shell dengan env vars yang tersinkronisasi."""
    sync_env_files()

    working_dir = cwd or MAIN_DIR
    env = os.environ.copy()
    if env_extra:
        env.update(env_extra)

    console.print(f"[bold cyan]▶ Menjalankan:[/] [dim]{' '.join(cmd)}[/] (di {working_dir.name}/)")

    try:
        process = subprocess.run(cmd, cwd=str(working_dir), env=env)
        # Re-sync setelah run in case script menulis ulang .env
        sync_env_files()
        return process.returncode
    except KeyboardInterrupt:
        console.print("\n[yellow]Proses dihentikan oleh pengguna (Ctrl+C).[/yellow]")
        return 0
    except Exception as e:
        console.print(f"[bold red]Error saat menjalankan perintah:[/] {e}")
        return 1


@click.group()
def cli() -> None:
    """Fana CLI - Unified Task Runner untuk Next.js & Telegram Bot."""
    pass


@cli.command("sync-env")
def sync_env_cmd() -> None:
    """Sinkronisasi file .env antara root dan main/."""
    sync_env_files()
    console.print("[bold green]✔ File .env root & main/ berhasil disinkronisasi![/bold green]")


@cli.command("dev")
@click.option("--port", "-p", default=3000, help="Port untuk Next.js web dashboard.")
def dev(port: int) -> None:
    """Menjalankan Next.js Web Dashboard di mode development."""
    console.print(Panel.fit("[bold green]Fana Finance - Web Dashboard Dev Server[/bold green]", border_style="green"))
    code = run_command(["bun", "run", "dev", "--port", str(port)])
    sys.exit(code)


@cli.command("bot")
def bot() -> None:
    """Menjalankan Telegram Bot lokal dengan long-polling (dev-bot.ts)."""
    console.print(Panel.fit("[bold cyan]Fana Finance - Telegram Bot Dev (Polling)[/bold cyan]", border_style="cyan"))
    code = run_command(["bun", "run", "bot:dev"])
    sys.exit(code)


@cli.command("install")
def install() -> None:
    """Install dependensi project (Bun di folder main/)."""
    console.print("[yellow]Menginstall dependensi Bun di main/...[/yellow]")
    code = run_command(["bun", "install"])
    sys.exit(code)


@cli.command("build")
def build() -> None:
    """Build aplikasi Next.js untuk produksi."""
    console.print("[yellow]Membuat build produksi Next.js...[/yellow]")
    code = run_command(["bun", "run", "build"])
    sys.exit(code)


@cli.command("start")
def start() -> None:
    """Menjalankan server produksi Next.js."""
    code = run_command(["bun", "run", "start"])
    sys.exit(code)


@cli.command("lint")
def lint() -> None:
    """Menjalankan ESLint pada codebase."""
    code = run_command(["bun", "run", "lint"])
    sys.exit(code)


@cli.command("check")
def check() -> None:
    """Menjalankan TypeScript Typecheck (tsc --noEmit)."""
    console.print("[yellow]Memeriksa validitas type TypeScript...[/yellow]")
    code = run_command(["bun", "x", "tsc", "--noEmit"])
    if code == 0:
        console.print("[bold green]✔ Tidak ada kesalahan tipe TypeScript![/bold green]")
    sys.exit(code)


@cli.group("db")
def db_group() -> None:
    """Perintah manajemen database PostgreSQL & Drizzle ORM."""
    pass


@db_group.command("push")
def db_push() -> None:
    """Push skema Drizzle langsung ke database PostgreSQL."""
    code = run_command(["bun", "run", "db:push"])
    sys.exit(code)


@db_group.command("generate")
def db_generate() -> None:
    """Generate file migrasi SQL baru dari schema.ts."""
    code = run_command(["bun", "run", "db:generate"])
    sys.exit(code)


@db_group.command("migrate")
def db_migrate() -> None:
    """Jalankan migrasi database terdaftar."""
    code = run_command(["bun", "run", "db:migrate"])
    sys.exit(code)


@db_group.command("studio")
def db_studio() -> None:
    """Buka GUI Drizzle Studio untuk eksplorasi database."""
    code = run_command(["bun", "run", "db:studio"])
    sys.exit(code)


@db_group.command("sync")
def db_sync() -> None:
    """Jalankan helper skrip db-sync.ts."""
    code = run_command(["bun", "run", "db:sync"])
    sys.exit(code)


@cli.group("webhook")
def webhook_group() -> None:
    """Manajemen Webhook Telegram Bot (Cloudflare / Produksi)."""
    pass


@webhook_group.command("set")
@click.option("--url", default="", help="Custom Webhook URL. Jika kosong, membaca dari TELEGRAM_BOT_WEBHOOK_URL.")
def webhook_set(url: str) -> None:
    """Set Webhook Telegram ke URL publik."""
    env = {"TELEGRAM_BOT_WEBHOOK_URL": url} if url else None
    code = run_command(["bun", "run", "webhook:set"], env_extra=env)
    sys.exit(code)


@webhook_group.command("info")
def webhook_info() -> None:
    """Cek informasi webhook bot saat ini di Telegram server."""
    code = run_command(["bun", "run", "webhook:info"])
    sys.exit(code)


@webhook_group.command("delete")
def webhook_delete() -> None:
    """Hapus webhook Telegram (kembalikan ke mode polling jika perlu)."""
    code = run_command(["bun", "run", "webhook:delete"])
    sys.exit(code)


if __name__ == "__main__":
    cli()
