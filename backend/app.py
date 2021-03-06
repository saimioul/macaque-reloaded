#!/usr/bin/env python3

"""The application entrypoint.
"""

import os
import shutil
import signal

import fire


def main(port=5000, config_dir="./models", public=False):
    """The application entrypoint
    
    Args:
        port: The port number on which the application will listen.
            Listens on port 5000 if not specified.
        public: Optional argument, if specified the application will
            listen on all public IPs. Otherwise, it runs only locally.
        config_dir: The path to the directory containing configuration
            files. If not specified, tries to look into './models'. If 
            the directory does not exist, or no configuration files are
            found, execution continues.
    """

    from flask_server import start_server
    from macaque_state import MacaqueState

    signal.signal(signal.SIGINT, handle_exit)

    state = MacaqueState(public=public, config_dir=config_dir)
    start_server(macaque_state=state, port=port, public=public)

def handle_exit(signum, frame):
    """Quits the application.

    Args:
        signum: Signal number.
        frame: Current stack frame object.
    """

    if os.path.isdir("imgs"):
        shutil.rmtree("imgs")
    exit(0)

if __name__ == "__main__":
    fire.Fire(main)
