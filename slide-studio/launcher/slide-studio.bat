@echo off
REM Slide Studio launcher (Windows). Double-click to start the local daemon and
REM open the workspace in the browser. No system Node install or admin rights
REM required (plan §13, issue #10).
REM
REM Slice 10:
REM  - Portable Node (AC2): prefer the bundled runtime at runtime\node\win32\node.exe;
REM    fall back to a `node` on PATH only for dev.
REM  - Orphan cleanup (AC3): the bin entry forwards exit signals to the daemon,
REM    whose shutdown handler kills the agent child + the server. Closing this
REM    window sends the signal that triggers that cleanup.
REM  - Spawn args are passed as discrete tokens (never one concatenated string)
REM    to avoid Windows quoting pitfalls.
setlocal
set "HERE=%~dp0"
set "APP_ROOT=%HERE%.."
set "BIN_ENTRY=%APP_ROOT%\apps\daemon\bin\slide-studio.mjs"
set "BUNDLED_NODE=%APP_ROOT%\runtime\node\win32\node.exe"

if exist "%BUNDLED_NODE%" (
  echo Slide Studio: using the bundled Node runtime.
  set "NODE_BIN=%BUNDLED_NODE%"
) else (
  set "NODE_BIN=node"
)

REM --experimental-strip-types loads the .ts daemon sources directly on Node 22.6+.
"%NODE_BIN%" --experimental-strip-types "%BIN_ENTRY%"
endlocal
