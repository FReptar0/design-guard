# Stitch Forge TUI Demo
# Run: vhs docs/demo.tape

Output docs/demo.gif

Set FontSize 14
Set Width 1200
Set Height 600
Set Theme "Catppuccin Mocha"
Set TypingSpeed 50ms
Set Padding 20

# Show the TUI launching
Type "npx tsx src/index.ts tui"
Enter
Sleep 2s

# Navigate the main menu
Sleep 1s
Down
Sleep 500ms
Down
Sleep 500ms
Down
Sleep 500ms
Up
Sleep 500ms
Up
Sleep 500ms
Up
Sleep 500ms

# Select Dashboard
Enter
Sleep 2s

# Go back to menu
Type "q"
Sleep 1s

# Navigate to Design Editor
Down
Sleep 300ms
Enter
Sleep 2s

# Go back
Type "q"
Sleep 1s

# Navigate to Generate
Down
Sleep 300ms
Down
Sleep 300ms
Enter
Sleep 2s

# Select a page type
Down
Sleep 300ms
Enter
Sleep 1s

# Type a description
Type "A modern landing page for a project management tool"
Sleep 500ms
Enter
Sleep 1s

# Type sections
Type "Hero with CTA, Features grid, Testimonials"
Sleep 500ms
Enter
Sleep 2s

# Go back to menu
Type "q"
Sleep 1s
Type "q"
Sleep 1s

# Show quota command
Type "npx tsx src/index.ts quota"
Enter
Sleep 2s

# Show workflow command
Type "npx tsx src/index.ts workflow"
Enter
Sleep 2s

Sleep 1s
