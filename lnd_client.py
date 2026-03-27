"""
LND REST API client for Lightning Network operations.
Handles invoice creation, payment verification, and node info.
"""

import base64
import os

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class LNDClient:
    def __init__(self, lnd_dir=None, rest_host=None):
        self.lnd_dir = lnd_dir or os.path.join(
            os.path.expanduser("~"), "bootcamp-code", "day3", "bob"
        )
        self.rest_host = rest_host or "https://localhost:8082"
        self.macaroon = self._read_macaroon()

    def _read_macaroon(self):
        macaroon_path = os.path.join(
            self.lnd_dir, "data", "chain", "bitcoin", "regtest", "admin.macaroon"
        )
        try:
            with open(macaroon_path, "rb") as f:
                return f.read().hex()
        except FileNotFoundError:
            print(f"[LND] Macaroon not found at: {macaroon_path}")
            return None

    def _headers(self):
        return {"Grpc-Metadata-macaroon": self.macaroon}

    def _get(self, path):
        url = f"{self.rest_host}{path}"
        return requests.get(url, headers=self._headers(), verify=False)

    def _post(self, path, data=None):
        url = f"{self.rest_host}{path}"
        return requests.post(url, headers=self._headers(), json=data, verify=False)

    def get_info(self):
        resp = self._get("/v1/getinfo")
        resp.raise_for_status()
        info = resp.json()
        return {
            "alias": info.get("alias", "unknown"),
            "pubkey": info.get("identity_pubkey", ""),
            "synced": info.get("synced_to_chain", False),
            "channels": info.get("num_active_channels", 0),
        }

    def channel_balance(self):
        resp = self._get("/v1/balance/channels")
        resp.raise_for_status()
        data = resp.json()
        return int(data.get("balance", 0))

    def wallet_balance(self):
        resp = self._get("/v1/balance/blockchain")
        resp.raise_for_status()
        data = resp.json()
        return int(data.get("total_balance", 0))

    def add_invoice(self, amount, memo=""):
        data = {"value": str(amount), "memo": memo}
        resp = self._post("/v1/invoices", data)
        resp.raise_for_status()
        result = resp.json()
        r_hash_hex = base64.b64decode(result["r_hash"]).hex()
        return {
            "r_hash": r_hash_hex,
            "payment_request": result["payment_request"],
        }

    def lookup_invoice(self, r_hash_hex):
        resp = self._get(f"/v1/invoice/{r_hash_hex}")
        resp.raise_for_status()
        data = resp.json()
        return {"settled": data.get("settled", False) or data.get("state") == "SETTLED"}

    def decode_pay_req(self, pay_req):
        resp = self._get(f"/v1/payreq/{pay_req}")
        resp.raise_for_status()
        return resp.json()
