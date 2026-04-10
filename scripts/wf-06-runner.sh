#!/bin/bash
# GlowRoute — WF-06 Runner Script
# Sources .keys.env and runs the clinic scraper with configurable city list

set -e

# Load API keys
KEYS_FILE="$HOME/.openclaw/workspace/.keys.env"
if [[ -f "$KEYS_FILE" ]]; then
    echo "🔑 Sourcing keys from $KEYS_FILE"
    source "$KEYS_FILE"
else
    echo "⚠️  Warning: .keys.env not found at $KEYS_FILE"
fi

# Default values
CITY="Tampa"
STATE="FL"
MAX=15
CITY_LIST=()

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --city)
            CITY="$2"
            shift 2
            ;;
        --state)
            STATE="$2"
            shift 2
            ;;
        --max)
            MAX="$2"
            shift 2
            ;;
        --city-list)
            # Comma-separated list: "Tampa,St. Petersburg,Orlando"
            IFS=',' read -ra CITY_LIST <<< "$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--city CITY] [--state STATE] [--max N] [--city-list 'City1,City2']"
            exit 1
            ;;
    esac
done

# Change to script directory
cd "$(dirname "$0")/.."

echo "🏙️  WF-06 Clinic Scraping Runner"
echo "================================"

if [[ ${#CITY_LIST[@]} -gt 0 ]]; then
    echo "Running batch for ${#CITY_LIST[@]} cities: ${CITY_LIST[*]}"
    for CITY_NAME in "${CITY_LIST[@]}"; do
        echo ""
        echo "📍 Processing $CITY_NAME, $STATE"
        echo "--------------------------------"
        node scripts/wf-06-clinic-scraper.js --city "$CITY_NAME" --state "$STATE" --max "$MAX"
        
        # Add delay between cities to avoid rate limits
        if [[ "$CITY_NAME" != "${CITY_LIST[-1]}" ]]; then
            echo "⏳ Waiting 10 seconds before next city..."
            sleep 10
        fi
    done
else
    echo "📍 Processing $CITY, $STATE"
    echo "--------------------------------"
    node scripts/wf-06-clinic-scraper.js --city "$CITY" --state "$STATE" --max "$MAX"
fi

echo ""
echo "✅ WF-06 runner completed!"