import json
import sys
from datetime import datetime


def read_payload():
    raw = sys.stdin.read().strip()
    return json.loads(raw) if raw else {}


def main():
    action = sys.argv[1] if len(sys.argv) > 1 else "health"
    payload = read_payload()

    if action == "health":
        print(
            json.dumps(
                {
                    "ready": True,
                    "provider": "ZKTeco",
                    "deviceModel": "SLK20R",
                    "message": "Replace this example with your real SDK adapter.",
                }
            )
        )
        return

    if action == "enroll":
        member_id = payload.get("memberId") or "member"
        template_id = f"TMP-{member_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        print(
            json.dumps(
                {
                    "memberId": member_id,
                    "templateId": template_id,
                    "provider": "ZKTeco",
                    "deviceModel": "SLK20R",
                    "fingerLabel": payload.get("fingerLabel", "right-thumb"),
                    "message": "Example enrollment response. Wire your SDK capture here.",
                }
            )
        )
        return

    if action == "identify":
        member_id = payload.get("memberId") or ""
        template_id = payload.get("templateId") or ""
        print(
            json.dumps(
                {
                    "memberId": member_id,
                    "templateId": template_id,
                    "provider": "ZKTeco",
                    "deviceModel": "SLK20R",
                    "fingerLabel": payload.get("fingerLabel", "right-thumb"),
                    "message": "Example identify response. Wire your SDK match here.",
                    "match": {
                        "memberId": member_id,
                        "templateId": template_id,
                    },
                }
            )
        )
        return

    print(json.dumps({"message": f"Unsupported action: {action}"}))
    sys.exit(1)


if __name__ == "__main__":
    main()
