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

# Ensure UTF-8 console output on Windows platforms
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
    Synchronize .env files between root and main/.
    Rules:
    1. Prioritize root .env as the single source of truth.
    2. If root .env exists and is newer (or main/.env is absent), copy root -> main/.
    3. If main/.env is newer than root, mirror back to root to prevent losing edits.
    4. Ensure main/.env is synchronized before running any command.
    """
    # 1. Sync .env.example
    if ROOT_ENV_EXAMPLE.exists() and not MAIN_ENV_EXAMPLE.exists():
        shutil.copy2(ROOT_ENV_EXAMPLE, MAIN_ENV_EXAMPLE)
    elif MAIN_ENV_EXAMPLE.exists() and not ROOT_ENV_EXAMPLE.exists():
        shutil.copy2(MAIN_ENV_EXAMPLE, ROOT_ENV_EXAMPLE)

    # 2. Sync .env
    if ROOT_ENV.exists() and not MAIN_ENV.exists():
        console.print("[yellow]Copying .env from root to main/...[/yellow]")
        shutil.copy2(ROOT_ENV, MAIN_ENV)
    elif MAIN_ENV.exists() and not ROOT_ENV.exists():
        console.print("[yellow]Copying .env from main/ to root...[/yellow]")
        shutil.copy2(MAIN_ENV, ROOT_ENV)
    elif ROOT_ENV.exists() and MAIN_ENV.exists():
        root_mtime = ROOT_ENV.stat().st_mtime
        main_mtime = MAIN_ENV.stat().st_mtime

        # If root is newer or equal (root is prioritized)
        if root_mtime >= main_mtime:
            if ROOT_ENV.read_bytes() != MAIN_ENV.read_bytes():
                shutil.copy2(ROOT_ENV, MAIN_ENV)
        else:
            # If main is newer
            if MAIN_ENV.read_bytes() != ROOT_ENV.read_bytes():
                console.print("[dim]Syncing .env: main/ is newer -> updating root .env[/dim]")
                shutil.copy2(MAIN_ENV, ROOT_ENV)


def run_command(cmd: list[str], cwd: Path | None = None, env_extra: dict[str, str] | None = None) -> int:
    """Execute a shell command with synchronized environment variables."""
    sync_env_files()

    working_dir = cwd or MAIN_DIR
    env = os.environ.copy()
    if env_extra:
        env.update(env_extra)

    console.print(f"[bold cyan]▶ Running:[/] [dim]{' '.join(cmd)}[/] (in {working_dir.name}/)")

    try:
        process = subprocess.run(cmd, cwd=str(working_dir), env=env)
        # Re-sync after execution in case the script updated .env
        sync_env_files()
        return process.returncode
    except KeyboardInterrupt:
        console.print("\n[yellow]Process interrupted by user (Ctrl+C).[/yellow]")
        return 0
    except Exception as e:
        console.print(f"[bold red]Execution error:[/] {e}")
        return 1


@click.group()
def cli() -> None:
    """Fana CLI - Unified Task Runner for Next.js & Telegram Bot."""
    pass


@cli.command("sync-env")
def sync_env_cmd() -> None:
    """Synchronize .env files between root and main/."""
    sync_env_files()
    console.print("[bold green]✔ Successfully synchronized .env files between root and main/![/bold green]")


@cli.command("dev")
@click.option("--port", "-p", default=3000, help="Port for Next.js web dashboard.")
def dev(port: int) -> None:
    """Start Next.js Web Dashboard in development mode."""
    console.print(Panel.fit("[bold green]Fana Finance - Web Dashboard Dev Server[/bold green]", border_style="green"))
    code = run_command(["bun", "run", "dev", "--port", str(port)])
    sys.exit(code)


@cli.command("bot")
def bot() -> None:
    """Start Telegram Bot locally with long-polling (dev-bot.ts)."""
    console.print(Panel.fit("[bold cyan]Fana Finance - Telegram Bot Dev (Polling)[/bold cyan]", border_style="cyan"))
    code = run_command(["bun", "run", "bot:dev"])
    sys.exit(code)


@cli.command("install")
def install() -> None:
    """Install project dependencies (Bun inside main/)."""
    console.print("[yellow]Installing Bun dependencies in main/...[/yellow]")
    code = run_command(["bun", "install"])
    sys.exit(code)


@cli.command("build")
def build() -> None:
    """Build Next.js web application for production."""
    console.print("[yellow]Building Next.js application for production...[/yellow]")
    code = run_command(["bun", "run", "build"])
    sys.exit(code)


@cli.command("start")
def start() -> None:
    """Start Next.js production server."""
    code = run_command(["bun", "run", "start"])
    sys.exit(code)


@cli.command("lint")
def lint() -> None:
    """Run ESLint checks across codebase."""
    code = run_command(["bun", "run", "lint"])
    sys.exit(code)


@cli.command("check")
def check() -> None:
    """Run TypeScript compiler type check (tsc --noEmit)."""
    console.print("[yellow]Checking TypeScript types...[/yellow]")
    code = run_command(["bun", "x", "tsc", "--noEmit"])
    if code == 0:
        console.print("[bold green]✔ TypeScript validation passed with zero errors![/bold green]")
    sys.exit(code)


@cli.group("db")
def db_group() -> None:
    """Database management commands for PostgreSQL & Drizzle ORM."""
    pass


@db_group.command("push")
def db_push() -> None:
    """Push Drizzle schema directly to PostgreSQL database."""
    code = run_command(["bun", "run", "db:push"])
    sys.exit(code)


@db_group.command("generate")
def db_generate() -> None:
    """Generate new SQL migrations from schema.ts."""
    code = run_command(["bun", "run", "db:generate"])
    sys.exit(code)


@db_group.command("migrate")
def db_migrate() -> None:
    """Apply pending database migrations."""
    code = run_command(["bun", "run", "db:migrate"])
    sys.exit(code)


@db_group.command("studio")
def db_studio() -> None:
    """Open Drizzle Studio visual web interface."""
    code = run_command(["bun", "run", "db:studio"])
    sys.exit(code)


@db_group.command("sync")
def db_sync() -> None:
    """Run helper script db-sync.ts."""
    code = run_command(["bun", "run", "db:sync"])
    sys.exit(code)


@cli.group("webhook")
def webhook_group() -> None:
    """Telegram Webhook management commands (Cloudflare / Production)."""
    pass


@webhook_group.command("set")
@click.option("--url", default="", help="Custom Webhook URL. If omitted, reads TELEGRAM_BOT_WEBHOOK_URL.")
def webhook_set(url: str) -> None:
    """Set Telegram Webhook to a public URL."""
    env = {"TELEGRAM_BOT_WEBHOOK_URL": url} if url else None
    code = run_command(["bun", "run", "webhook:set"], env_extra=env)
    sys.exit(code)


@webhook_group.command("info")
def webhook_info() -> None:
    """Inspect current Telegram webhook status."""
    code = run_command(["bun", "run", "webhook:info"])
    sys.exit(code)


@webhook_group.command("delete")
def webhook_delete() -> None:
    """Delete Telegram webhook (revert to polling mode if needed)."""
    code = run_command(["bun", "run", "webhook:delete"])
    sys.exit(code)


if __name__ == "__main__":
    cli()
