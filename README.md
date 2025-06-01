# 🔐 gmana-cli

A sleek, interactive, and secure CLI tool for generating and managing passwords with modern UX, strong encryption, and smart features.

## Installation

```bash
npm install -g gmana
```

## Basic Usage

Basic Password Generation

```bash
gmana gen                 # Default secure password
gmana gen -l 20           # Custom length
gmana gen --no-symbols    # Exclude symbols
gmana gen -l 16 --extra-symbols --exclude-similar
```

## Interactive Mode

```bash
gmana gen -i
```

## Configuration

```bash
# Show Current Config
gmana config --show


# Update Config
gmana config --set length=16
gmana config --set savehistory=true
gmana config --set autocopy=false

# gmana config
gmana config
```

## History

```bash
gmana history --list
```

## History Interactive Mode

```bash
gmana history
```

### Options include:

- View & copy passwords
- Masked display
- Clear history

## Clear History

```bash
gmana history --clear
```

## Advanced Usage

### Command Aliases

```bash
gmana g       # gen
gmana g -i    # gen --interactive
gmana c       # config
gmana h       # history
```

### General Options

```bash
gmana gen -l 32 --extra-symbols --exclude-ambiguous
gmana gen -l 6 --no-uppercase --no-lowercase --no-symbols
gmana gen -l 12 --no-numbers --no-symbols
```

### Batch Generation

```bash
for i in {1..5}; do gmana gen -l 16; done
```

## 🎨 Features

- 🌈 Colorful and emoji-rich output
- ⚡ Progress spinners and live feedback
- 📋 Smart config/history formatting
- 🔐 Secure password generation (crypto.randomInt)
- ✅ Auto-copy to clipboard
- 📊 Strength scoring and suggestions
- 🕵️‍♂️ History masking (first/last 2 chars only)
