@echo off
setlocal
if exist public (
  for /r public %%f in (*.svg) do (
    echo Deleting %%f
    del /f /q "%%f"
  )
)
if exist public\assets\tiles rmdir /s /q public\assets\tiles
echo v1.0.6 legacy SVG cleanup complete.
