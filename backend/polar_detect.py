"""
Auto-detect Polar Lightning Network simulator configuration.
Reads Polar's networks.json to find LND node settings automatically.
"""

import json
import os


def find_polar_node(node_name="bob"):
    """Find an LND node in Polar's configuration by name."""
    polar_path = os.path.join(os.path.expanduser("~"), ".polar", "networks", "networks.json")

    if not os.path.exists(polar_path):
        return None

    try:
        with open(polar_path, "r") as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError):
        return None

    networks = data.get("networks", [])
    best_match = None

    for network in networks:
        nodes = network.get("nodes", {})
        lnd_nodes = nodes.get("lightning", [])

        for node in lnd_nodes:
            if node.get("implementation") != "LND":
                continue
            if node.get("name", "").lower() == node_name.lower():
                network_path = network.get("path", "")
                name = node.get("name", "")
                ports = node.get("ports", {})
                rest_port = ports.get("rest", 8082)

                result = {
                    "name": name,
                    "lnd_dir": os.path.join(network_path, "volumes", "lnd", name),
                    "rest_host": f"https://127.0.0.1:{rest_port}",
                    "rest_port": rest_port,
                    "network_name": network.get("name", ""),
                }

                if network.get("status") == "Started":
                    return result

                if best_match is None:
                    best_match = result

    return best_match


def auto_detect(node_name="bob"):
    """
    Auto-detect LND configuration.
    Priority: environment variables > Polar detection > defaults.
    Returns (lnd_dir, rest_host) tuple.
    """
    env_lnd_dir = os.environ.get("LND_DIR")
    env_rest_host = os.environ.get("REST_HOST")

    if env_lnd_dir and env_rest_host:
        return env_lnd_dir, env_rest_host

    polar = find_polar_node(node_name)
    if polar:
        print(f"[Polar] Found node '{polar['name']}' in network '{polar['network_name']}'")
        print(f"[Polar] LND dir: {polar['lnd_dir']}")
        print(f"[Polar] REST host: {polar['rest_host']}")
        return polar["lnd_dir"], polar["rest_host"]

    return None, None
