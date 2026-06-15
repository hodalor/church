#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
FLUTTER_ROOT_DEFAULT="/Users/macbook/Documents/projects/Roadguide/.flutter-sdk"
JAVA_HOME_DEFAULT="/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home"
XDG_CONFIG_DIR="${PROJECT_ROOT}/.xdg_config"

export JAVA_HOME="${JAVA_HOME:-$JAVA_HOME_DEFAULT}"
export FLUTTER_ROOT="${FLUTTER_ROOT:-$FLUTTER_ROOT_DEFAULT}"
export XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$XDG_CONFIG_DIR}"
export FLUTTER_ALREADY_LOCKED=true

DART_BIN="${FLUTTER_ROOT}/bin/cache/dart-sdk/bin/dart"
PACKAGE_CONFIG="${FLUTTER_ROOT}/packages/flutter_tools/.dart_tool/package_config.json"
FLUTTER_SNAPSHOT="${FLUTTER_ROOT}/bin/cache/flutter_tools.snapshot"

if [[ ! -x "${DART_BIN}" ]]; then
  echo "Flutter Dart binary not found at: ${DART_BIN}" >&2
  exit 1
fi

if [[ ! -f "${PACKAGE_CONFIG}" ]]; then
  echo "Flutter tool package config not found at: ${PACKAGE_CONFIG}" >&2
  exit 1
fi

mkdir -p "${XDG_CONFIG_HOME}"
cd "${PROJECT_ROOT}"

echo "Using JAVA_HOME=${JAVA_HOME}"
echo "Using FLUTTER_ROOT=${FLUTTER_ROOT}"
echo "Using XDG_CONFIG_HOME=${XDG_CONFIG_HOME}"

"${DART_BIN}" \
  --packages="${PACKAGE_CONFIG}" \
  "${FLUTTER_SNAPSHOT}" \
  build apk \
  --release \
  --target-platform android-arm64

echo
echo "If the build succeeds, look for the APK at:"
echo "${PROJECT_ROOT}/build/app/outputs/flutter-apk/app-release.apk"
