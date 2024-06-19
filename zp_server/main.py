import logging
import os
import shutil
import sys
import webbrowser

if sys.stdout is None:
    # Fix bottle crash when windowed
    from io import StringIO

    sys.stdout = StringIO()
    sys.stderr = StringIO()

import requests
from PIL import Image

from zp_server import web_server, user_config, updater
from zp_server.server_data import LINK_SRC, LINK_WEB, PORT, ROOT_DIR, CONFIG_DIR, PROJECTS_DIR

logging.basicConfig(level=logging.DEBUG)


class State:
    applet = None


def main():
    if is_running():
        return webbrowser.open(f"http://127.0.0.1:{PORT}")

    prepare_dirs()

    # Linux pystray backend force
    if sys.platform == "linux":
        os.environ["PYSTRAY_BACKEND"] = "appindicator"

    # Tray menu
    import pystray
    State.applet = pystray.Icon("ZeppPlayer",
                                icon=Image.open(ROOT_DIR / "app" / "icon.png"),
                                menu=build_menu())

    # Run server
    web_server.start()

    # Extras
    if user_config.get_prop("auto_browser", True):
        webbrowser.open(f"http://127.0.0.1:{PORT}")
    if sys.platform != "darwin" and user_config.get_prop("check_updates", True):
        updater.run()

    State.applet.run()


def prepare_dirs():
    if not CONFIG_DIR.exists():
        CONFIG_DIR.mkdir(parents=True)

    if not PROJECTS_DIR.exists() and PROJECTS_DIR != ROOT_DIR / "projects":
        shutil.copytree(ROOT_DIR / "projects", PROJECTS_DIR)


def build_menu():
    import pystray
    main_menu = pystray.Menu(
        pystray.MenuItem('Open Chrome',
                         lambda: webbrowser.open(f"http://127.0.0.1:{PORT}"),
                         default=True),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem('Website', lambda: webbrowser.open(LINK_WEB)),
        pystray.MenuItem('Source code', lambda: webbrowser.open(LINK_SRC)),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Check for update on start", toggle_updater,
                         checked=lambda _: user_config.get_prop("check_updates", False)),
        pystray.MenuItem("Open browser on start", toggle_auto_browser,
                         checked=lambda _: user_config.get_prop("auto_browser", True)),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem(f"ver. {updater.get_self_version()}", None, enabled=False),
        pystray.MenuItem("Exit", do_exit)
    )
    return main_menu


def do_exit():
    # noinspection PyUnresolvedReferences,PyProtectedMember
    os._exit(0)


def toggle_updater():
    user_config.set_prop("check_updates", not user_config.get_prop("check_updates", False))


def toggle_auto_browser():
    user_config.set_prop("auto_browser", not user_config.get_prop("auto_browser", True))


def is_running():
    try:
        resp = requests.get(f"http://127.0.0.1:3195/app/icon.png")
        assert resp.status_code == 200
        return True
    except Exception:
        return False


if __name__ == "__main__":
    main()
