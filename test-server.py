#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
シンプルなAPIリクエスト検証用サーバー
GET, POST, PUT, DELETE, PATCHなどのHTTPメソッドを受け付け、
リクエストの詳細情報をコンソールに表示します。
"""

import json
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse


class RequestHandler(BaseHTTPRequestHandler):
    """リクエストを処理し、詳細情報を表示するハンドラー"""

    def log_request_details(self):
        """リクエストの詳細をコンソールに表示"""
        print("\n" + "=" * 80)
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] リクエスト受信")
        print("=" * 80)

        # メソッド名
        print(f"\n📌 メソッド: {self.command}")

        # URL情報
        parsed_url = urlparse(self.path)
        print("\n🔗 URL情報:")
        print(f"   完全パス: {self.path}")
        print(f"   パス: {parsed_url.path}")

        # クエリパラメータ
        query_params = parse_qs(parsed_url.query)
        if query_params:
            print("\n🔍 クエリパラメータ:")
            for key, values in query_params.items():
                for value in values:
                    print(f"   {key} = {value}")
        else:
            print("\n🔍 クエリパラメータ: なし")

        # ヘッダー
        print("\n📋 ヘッダー:")
        for header, value in self.headers.items():
            print(f"   {header}: {value}")

        # ボディ
        content_length = self.headers.get('Content-Length')
        if content_length:
            content_length = int(content_length)
            body = self.rfile.read(content_length)
            print("\n📦 ボディ:")
            print(f"   サイズ: {content_length} bytes")

            # Content-Typeに応じてボディを表示
            content_type = self.headers.get('Content-Type', '')

            if 'application/json' in content_type:
                try:
                    body_json = json.loads(body.decode('utf-8'))
                    print("   JSON:")
                    print(f"   {json.dumps(body_json, indent=6, ensure_ascii=False)}")
                except json.JSONDecodeError:
                    print(f"   Raw: {body.decode('utf-8', errors='replace')}")
            else:
                body_str = body.decode('utf-8', errors='replace')
                print(f"   Raw: {body_str}")
        else:
            print("\n📦 ボディ: なし")

        print("\n" + "=" * 80 + "\n")

    def send_json_response(self, status_code=200, data=None):
        """JSON形式のレスポンスを送信"""
        if data is None:
            data = {
                "status": "success",
                "message": f"{self.command} リクエストを受信しました",
                "timestamp": datetime.now().isoformat()
            }

        response_body = json.dumps(data, ensure_ascii=False, indent=2)
        response_bytes = response_body.encode('utf-8')

        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(response_bytes)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_GET(self):
        """GETリクエストの処理"""
        self.log_request_details()
        self.send_json_response()

    def do_POST(self):
        """POSTリクエストの処理"""
        self.log_request_details()
        self.send_json_response(201)

    def do_PUT(self):
        """PUTリクエストの処理"""
        self.log_request_details()
        self.send_json_response()

    def do_DELETE(self):
        """DELETEリクエストの処理"""
        self.log_request_details()
        self.send_json_response()

    def do_PATCH(self):
        """PATCHリクエストの処理"""
        self.log_request_details()
        self.send_json_response()

    def do_OPTIONS(self):
        """OPTIONSリクエストの処理（CORS対応）"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def log_message(self, format, *args):
        """デフォルトのログ出力を抑制"""
        pass


def run_server(host='localhost', port=8000):
    """サーバーを起動"""
    server_address = (host, port)
    httpd = HTTPServer(server_address, RequestHandler)

    print("\n" + "=" * 80)
    print("🚀 APIリクエスト検証用サーバーを起動しました")
    print("=" * 80)
    print(f"\n📍 サーバーアドレス: http://{host}:{port}")
    print("\n💡 使用方法:")
    print(f"   curl http://{host}:{port}/api/test")
    print(f"   curl -X POST http://{host}:{port}/api/test -H 'Content-Type: application/json' -d '{{\"key\":\"value\"}}'")
    print("\n⚠️  終了するには Ctrl+C を押してください")
    print("\n" + "=" * 80 + "\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 サーバーを停止しています...")
        httpd.shutdown()
        print("✅ サーバーが停止しました\n")


if __name__ == '__main__':
    # デフォルトはlocalhost:8000で起動
    # 別のポートを使用したい場合は以下を変更してください
    run_server(host='localhost', port=8000)
