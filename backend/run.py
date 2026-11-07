import uvicorn
import os
import sys

# Ensure backend package is in pythonpath
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def ensure_dev_certificates(cert_path: str, key_path: str) -> bool:
    """Ensure localhost self-signed SSL certificates exist for development."""
    if os.path.exists(cert_path) and os.path.exists(key_path):
        return True
    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        import datetime
        import ipaddress

        os.makedirs(os.path.dirname(cert_path), exist_ok=True)
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "SOILEX Dev"),
        ])
        cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.datetime.now(datetime.timezone.utc))
            .not_valid_after(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3650))
            .add_extension(
                x509.SubjectAlternativeName([
                    x509.DNSName("localhost"),
                    x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
                    x509.IPAddress(ipaddress.IPv6Address("::1")),
                ]),
                critical=False,
            )
            .sign(key, hashes.SHA256())
        )
        with open(key_path, "wb") as f:
            f.write(
                key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.TraditionalOpenSSL,
                    encryption_algorithm=serialization.NoEncryption(),
                )
            )
        with open(cert_path, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        print(f"[HTTPS] Generated localhost SSL certificates in {os.path.dirname(cert_path)}")
        return True
    except Exception as e:
        print(f"[HTTP] Could not auto-generate SSL certs ({e}), running on HTTP")
        return False


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cert_path = os.path.join(base_dir, "certs", "localhost-cert.pem")
    key_path = os.path.join(base_dir, "certs", "localhost-key.pem")

    has_certs = ensure_dev_certificates(cert_path, key_path)

    kwargs = {
        "app": "app.main:app",
        "host": "0.0.0.0",
        "port": 8000,
        "reload": True,
        "reload_dirs": [os.path.dirname(os.path.abspath(__file__))],
        "log_level": "info",
    }

    if has_certs and os.path.exists(cert_path) and os.path.exists(key_path):
        kwargs["ssl_certfile"] = cert_path
        kwargs["ssl_keyfile"] = key_path
        print("[HTTPS] Starting FastAPI server on https://localhost:8000")
    else:
        print("[HTTP] Starting FastAPI server on http://localhost:8000")

    uvicorn.run(**kwargs)
