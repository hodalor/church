# Biometric Bridge

This local service exposes the HTTP endpoints already used by the Prynova frontend:

- `GET /health`
- `POST /fingerprint/enroll`
- `POST /fingerprint/identify`

It is intended to run on a Windows PC that has the ZKTeco scanner attached.

## Supported SDK

For the `SLK20R`, the official SDK line is `ZKFinger SDK for Windows`, which ZKTeco lists as compatible with `SLK20R` and other ZK USB scanners.[1]

## Why this bridge exists

Browsers cannot talk directly to the ZKTeco USB SDK. The admin app therefore calls a local HTTP bridge, and the bridge calls your SDK wrapper on the same machine.

This is especially important when your main backend is hosted on `Cloud Run`, `Render`, or another cloud platform. The backend stays in the cloud. Only the bridge runs locally on the Windows scanner PC.

## Fresh scanner PC setup

From the hosted admin app:

1. Open member fingerprint enrollment or service biometric check-in.
2. Click `Download Windows Installer`.
3. Run the downloaded `install-prynova-biometric-bridge.cmd`.
4. Use the desktop shortcut `Start Prynova Fingerprint Bridge`.
5. Return to the app and click `Refresh Bridge`.

The installer places the bridge in `%LOCALAPPDATA%\\Prynova\\biometric-bridge` and creates a desktop launcher so the operator does not need to run the backend locally.
On a brand new machine, the installer leaves the bridge in `shell` mode until the ZKTeco SDK adapter command is configured, so the app does not incorrectly show the scanner as ready before the real hardware integration is in place.

## Quick start

1. Copy `.env.example` to `.env`.
2. Start in mock mode:

```bash
cd biometric-bridge
node server.js
```

3. Point the frontend to the bridge:

```env
REACT_APP_BIOMETRIC_BRIDGE_URL=http://127.0.0.1:4113
```

## Modes

### `BIOMETRIC_BRIDGE_MODE=mock`

Useful for UI testing before the real scanner is fully wired.

Optional mock values:

```env
MOCK_IDENTIFY_MEMBER_ID=tenant-000001
MOCK_IDENTIFY_TEMPLATE_ID=TMP-TENANT-000001
```

### `BIOMETRIC_BRIDGE_MODE=shell`

Use this when you already have a Python or native SDK adapter script.

```env
BIOMETRIC_BRIDGE_MODE=shell
BIOMETRIC_BRIDGE_ENROLL_COMMAND=python adapters\\zkteco_adapter.py enroll
BIOMETRIC_BRIDGE_IDENTIFY_COMMAND=python adapters\\zkteco_adapter.py identify
BIOMETRIC_BRIDGE_HEALTH_COMMAND=python adapters\\zkteco_adapter.py health
```

The bridge sends JSON to `stdin` and expects JSON on `stdout`.

## Expected JSON contract

### Enroll response

```json
{
  "memberId": "church-000001",
  "templateId": "TMP-CHURCH-000001-20260908123000",
  "provider": "ZKTeco",
  "deviceModel": "SLK20R",
  "fingerLabel": "right-thumb",
  "message": "Fingerprint captured successfully."
}
```

### Identify response

```json
{
  "memberId": "church-000001",
  "templateId": "TMP-CHURCH-000001-20260908123000",
  "provider": "ZKTeco",
  "deviceModel": "SLK20R",
  "fingerLabel": "right-thumb",
  "message": "Fingerprint matched.",
  "match": {
    "memberId": "church-000001",
    "templateId": "TMP-CHURCH-000001-20260908123000"
  }
}
```

## Wiring to the existing app

- Member enrollment page already calls `POST /fingerprint/enroll`.
- Attendance check-in console already calls `POST /fingerprint/identify`.
- Backend attendance already accepts biometric check-in by `templateId` or `memberId`.

That means once your shell adapter returns the contract above, the current app can enroll fingerprints and use them for service attendance.

## Event attendance and check-out

Right now this repo supports:

- service biometric check-in
- event QR/manual check-in

It does **not** yet have:

- biometric event check-in
- attendance check-out / check-out time tracking

Those can be added next on top of this bridge.

## Reference adapter

See `adapters/zkteco_adapter.example.py` for the stdin/stdout contract shape. Replace the example logic with your real SDK capture and identification calls.

## References

[1] ZKTeco, "ZKFinger SDK for Windows" - official product page listing `SLK20R` compatibility and noting that the SDK package includes driver, development documents, and demo: https://www.zkteco.com/en/ZKFingerSDKforWindows/ZKFinger-SDK-for-Windows
