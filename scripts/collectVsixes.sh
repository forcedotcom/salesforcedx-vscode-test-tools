#!/bin/bash

# Function to display usage information
usage() {
    echo "Usage: $0 [options]"
    echo "This script finds all .vsix files in the salesforcedx-vscode project and"
    echo "copies them to an extensions directory."
    echo ""
    echo "Options:"
    echo "  -h, --help     Display this help message and exit"
    exit 1
}

# Parse command line arguments
if [ $# -eq 1 ]; then
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        usage
    fi
fi

# Define the target project name
TARGET_PROJECT="salesforcedx-vscode"

# Determine project root based on execution location
CURRENT_DIR=$(pwd)
DIR_NAME=$(basename "$CURRENT_DIR")

if [ "$DIR_NAME" = "scripts" ] && [ -d "../$TARGET_PROJECT" ]; then
    # Running from scripts directory at same level as salesforcedx-vscode
    echo "Running from scripts directory. Using sibling salesforcedx-vscode as project root."
    PROJECT_ROOT=$(realpath "../$TARGET_PROJECT")
elif [ "$DIR_NAME" = "scripts" ] && [ -d ".." ]; then
    # Running from scripts directory inside salesforcedx-vscode
    echo "Running from scripts directory inside project. Using parent as project root."
    PROJECT_ROOT=$(realpath "..")
elif [ "$DIR_NAME" = "$TARGET_PROJECT" ]; then
    # Running from the salesforcedx-vscode directory itself
    echo "Running from $TARGET_PROJECT directory. Using current directory as project root."
    PROJECT_ROOT=$(realpath ".")
elif [ -d "../$TARGET_PROJECT" ]; then
    # Running from a sibling directory of salesforcedx-vscode
    echo "Running from sibling directory. Using ../$TARGET_PROJECT as project root."
    PROJECT_ROOT=$(realpath "../$TARGET_PROJECT")
elif [ -d "./$TARGET_PROJECT" ]; then
    # Running from parent of salesforcedx-vscode
    echo "Running from parent directory. Using ./$TARGET_PROJECT as project root."
    PROJECT_ROOT=$(realpath "./$TARGET_PROJECT")
else
    echo "Error: Could not locate the salesforcedx-vscode directory."
    echo "Please run this script from within or adjacent to the salesforcedx-vscode project."
    exit 1
fi

echo "Project root: $PROJECT_ROOT"

# Create extensions directory if it doesn't exist
EXTENSIONS_DIR="$PROJECT_ROOT/extensions"
if [ ! -d "$EXTENSIONS_DIR" ]; then
    echo "Creating extensions directory at: $EXTENSIONS_DIR"
    mkdir -p "$EXTENSIONS_DIR"
else
    echo "Extensions directory already exists at: $EXTENSIONS_DIR"
fi

# Find all .vsix files excluding those in the extensions directory
echo "Searching for .vsix files in $PROJECT_ROOT..."
VSIX_FILES=$(find "$PROJECT_ROOT" -type f -name "*.vsix" -not -path "$EXTENSIONS_DIR/*" 2>/dev/null)

# Check if any .vsix files were found
if [ -z "$VSIX_FILES" ]; then
    echo "No .vsix files found in the salesforcedx-vscode directory."
    exit 0
fi

# Copy all found .vsix files to the extensions directory
echo "Copying .vsix files to extensions directory..."
COUNT=0
for file in $VSIX_FILES; do
    FILE_NAME=$(basename "$file")
    echo "Copying: $FILE_NAME"
    cp -f "$file" "$EXTENSIONS_DIR/"
    ((COUNT++))
done

echo "Done! $COUNT .vsix files have been copied to: $EXTENSIONS_DIR"
