#!/usr/bin/env python3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
import sys


PORT = 8080
PROXY_PREFIX = "/radar-api"
RADAR_API_ORIGIN = "https://mmradar.inchitech.com"

HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
}

RESPONSE_HEADERS_TO_SKIP = HOP_BY_HOP_HEADERS | {
    "access-control-allow-origin",
    "access-control-allow-headers",
    "access-control-allow-methods",
    "access-control-allow-credentials",
}

REQUEST_HEADERS_TO_SKIP = HOP_BY_HOP_HEADERS | {
    "host",
    "origin",
    "referer",
    "content-length",
}


class RadarStaticHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        if self.path.startswith(PROXY_PREFIX):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", "*"))
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            self.end_headers()
            return
        super().do_OPTIONS()

    def do_GET(self):
        if self.path.startswith(PROXY_PREFIX):
            self.proxy_to_radar()
            return
        super().do_GET()

    def do_POST(self):
        if self.path.startswith(PROXY_PREFIX):
            self.proxy_to_radar()
            return
        self.send_error(404, "Not Found")

    def proxy_to_radar(self):
        upstream_path = self.path[len(PROXY_PREFIX):] or "/"
        target_url = RADAR_API_ORIGIN + upstream_path
        content_length = int(self.headers.get("Content-Length", "0") or "0")
        body = self.rfile.read(content_length) if content_length else None
        headers = {
            key: value
            for key, value in self.headers.items()
            if key.lower() not in REQUEST_HEADERS_TO_SKIP
        }
        headers["Host"] = urlsplit(RADAR_API_ORIGIN).netloc

        request = Request(target_url, data=body, headers=headers, method=self.command)
        try:
            with urlopen(request, timeout=30) as response:
                self.send_response(response.status)
                for key, value in response.headers.items():
                    if key.lower() not in RESPONSE_HEADERS_TO_SKIP:
                        self.send_header(key, value)
                self.end_headers()
                self.wfile.write(response.read())
        except HTTPError as error:
            self.send_response(error.code)
            for key, value in error.headers.items():
                if key.lower() not in RESPONSE_HEADERS_TO_SKIP:
                    self.send_header(key, value)
            self.end_headers()
            self.wfile.write(error.read())
        except URLError as error:
            message = str(error.reason).encode("utf-8", errors="replace")
            self.send_response(502)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(message)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    server = ThreadingHTTPServer(("0.0.0.0", port), RadarStaticHandler)
    print(f"Serving static files and /radar-api proxy at http://localhost:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.", flush=True)
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
