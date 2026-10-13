"""SC6113 FairHold demonstration: Flask web/API backend (no private keys)."""

from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import json
import os
from pathlib import Path
import re
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
ROOT = Path(__file__).resolve().parent
ADDRESS_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")
TX_RE = re.compile(r"^0x[a-fA-F0-9]{64}$")


def settings():
    with (ROOT / "config.json").open(encoding="utf-8") as handle:
        cfg = json.load(handle)
    return {
        "contract_address": cfg.get("contract_address", ""),
        "deployment_block": int(cfg.get("deployment_block", 0)),
        "chain_id": 11155111,  # Ethereum Sepolia
    }


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/config")
def config():
    # Public contract metadata, never a seed phrase or a private key.
    return jsonify(settings())


@app.post("/api/validate")
def validate():
    """Offer a friendly preflight check; the smart contract enforces final rules."""
    data = request.get_json(silent=True) or {}
    seller = str(data.get("seller", "")).strip()
    buyer = str(data.get("buyer", "")).strip()
    amount_text = str(data.get("amount_eth", "")).strip()

    if not ADDRESS_RE.fullmatch(seller):
        return jsonify(error="Enter a valid 0x-prefixed seller address."), 400
    if not ADDRESS_RE.fullmatch(buyer):
        return jsonify(error="Connect your wallet before creating an escrow."), 400
    if seller.lower() == buyer.lower():
        return jsonify(error="Buyer and seller must be different wallets."), 400

    try:
        amount = Decimal(amount_text)
        if not amount.is_finite() or amount <= 0:
            raise ValueError()
        wei = amount * Decimal(10**18)
        if wei != wei.to_integral_value():
            return jsonify(error="ETH amounts may have at most 18 decimals."), 400
        amount_wei = int(wei)
        if amount_wei >= 2**256:
            raise ValueError()
    except (InvalidOperation, ValueError, OverflowError):
        return jsonify(error="Enter a positive, finite ETH amount."), 400

    try:
        deadline = int(data.get("refund_after", ""))
    except (ValueError, TypeError, OverflowError):
        return jsonify(error="Enter a valid refund deadline."), 400
    now = int(time.time())
    if deadline <= now + 120:
        return jsonify(error="Choose a deadline at least 2 minutes in the future."), 400
    if deadline > now + 365 * 86400:
        return jsonify(error="The deadline must be within one year."), 400

    return jsonify(
        ok=True,
        amount_wei=str(amount_wei),
        refund_after=deadline,
        deadline_utc=datetime.fromtimestamp(deadline, timezone.utc).isoformat(),
    )


def rpc(method, params):
    endpoint = os.environ.get("SEPOLIA_RPC_URL", "").strip()
    if not endpoint:
        raise RuntimeError("SEPOLIA_RPC_URL is not configured in the Flask environment")
    payload = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    req = Request(endpoint, payload, {"Content-Type": "application/json"}, method="POST")
    with urlopen(req, timeout=12) as response:
        result = json.load(response)
    if "error" in result:
        raise RuntimeError(str(result["error"]))
    return result.get("result")


@app.get("/api/verify/<tx_hash>")
def verify_transaction(tx_hash):
    """Server checks a receipt against the configured escrow contract, read-only."""
    if not TX_RE.fullmatch(tx_hash):
        return jsonify(error="Invalid transaction hash."), 400
    contract_address = settings()["contract_address"]
    if not ADDRESS_RE.fullmatch(contract_address):
        return jsonify(error="Set contract_address in config.json first."), 503
    try:
        tx = rpc("eth_getTransactionByHash", [tx_hash])
        receipt = rpc("eth_getTransactionReceipt", [tx_hash])
    except (RuntimeError, HTTPError, URLError, OSError, TimeoutError) as exc:
        return jsonify(error=f"RPC verification unavailable: {exc}"), 503
    if tx is None:
        return jsonify(found=False, confirmed=False), 404
    belongs = (tx.get("to") or "").lower() == contract_address.lower()
    mined = receipt is not None
    return jsonify(
        found=True,
        confirmed=mined,
        success=(int(receipt["status"], 16) == 1) if mined else None,
        belongs_to_contract=belongs,
        block_number=int(receipt["blockNumber"], 16) if mined else None,
        transaction_hash=tx_hash,
    )


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
