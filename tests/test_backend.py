"""Run after installing requirements: python -m unittest discover -s tests -v"""

import time
import unittest

from app import app


class EscrowBackendTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.a = "0x" + "a" * 40
        self.b = "0x" + "b" * 40

    def payload(self, **changes):
        params = {
            "buyer": self.a,
            "seller": self.b,
            "amount_eth": "0.001",
            "refund_after": int(time.time()) + 600,
        }
        params.update(changes)
        return params

    def test_positive_quote_and_conversion(self):
        response = self.client.post("/api/validate", json=self.payload())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["amount_wei"], "1000000000000000")

    def test_same_wallet_rejected(self):
        response = self.client.post("/api/validate", json=self.payload(seller=self.a))
        self.assertEqual(response.status_code, 400)

    def test_zero_amount_rejected(self):
        response = self.client.post("/api/validate", json=self.payload(amount_eth="0"))
        self.assertEqual(response.status_code, 400)

    def test_fractional_wei_rejected(self):
        response = self.client.post("/api/validate", json=self.payload(amount_eth="0.0000000000000000001"))
        self.assertEqual(response.status_code, 400)

    def test_malformed_seller_rejected(self):
        response = self.client.post("/api/validate", json=self.payload(seller="0x123"))
        self.assertEqual(response.status_code, 400)

    def test_expired_deadline_rejected(self):
        response = self.client.post("/api/validate", json=self.payload(refund_after=int(time.time()) - 1))
        self.assertEqual(response.status_code, 400)

    def test_invalid_tx_hash_rejected(self):
        response = self.client.get("/api/verify/not-a-transaction-hash")
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
