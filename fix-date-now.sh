#!/bin/bash

# Script to replace Date.now() with getVietnamTimestamp() in all TypeScript files
# Excludes RainEffect.tsx (animation timing)

echo "🔍 Finding all Date.now() occurrences (excluding RainEffect)..."

# List of files to process (excluding RainEffect)
FILES=$(grep -rl "Date.now()" src/ --include="*.ts" --include="*.tsx" | grep -v "RainEffect.tsx")

if [ -z "$FILES" ]; then
  echo "✅ No Date.now() found!"
  exit 0
fi

echo "📝 Files to process:"
echo "$FILES"
echo ""

# Process each file
for file in $FILES; do
  echo "Processing: $file"
  
  # Check if file needs getVietnamTimestamp import
  if ! grep -q "getVietnamTimestamp" "$file"; then
    echo "  → Adding import for getVietnamTimestamp"
    
    # Find the last import line
    last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
    
    if [ ! -z "$last_import_line" ]; then
      # Check if it's already importing from @/utils/time
      if grep -q "from '@/utils/time'" "$file" || grep -q 'from "@/utils/time"' "$file"; then
        echo "  → Already imports from @/utils/time, adding getVietnamTimestamp to existing import"
        # Add getVietnamTimestamp to existing import
        sed -i '' "s/from '@\/utils\/time'/getVietnamTimestamp } from '@\/utils\/time'/g" "$file"
        sed -i '' 's/from "@\/utils\/time"/getVietnamTimestamp } from "@\/utils\/time"/g' "$file"
        sed -i '' "s/{ /{ getVietnamTimestamp, /g" "$file"
      else
        # Add new import line after last import
        sed -i '' "${last_import_line}a\\
import { getVietnamTimestamp } from '@/utils/time';
" "$file"
      fi
    fi
  fi
  
  # Replace Date.now() with getVietnamTimestamp()
  echo "  → Replacing Date.now() with getVietnamTimestamp()"
  sed -i '' 's/Date\.now()/getVietnamTimestamp()/g' "$file"
  
  echo "  ✅ Done"
  echo ""
done

echo[object Object] processed!"
echo ""
echo "📊 Checking remaining Date.now() (excluding RainEffect):"
remaining=$(grep -r "Date.now()" src/ --include="*.ts" --include="*.tsx" | grep -v "RainEffect" | wc -l)
echo "Remaining: $remaining"

if [ "$remaining" -eq 0 ]; then
  echo "✅ All Date.now() replaced successfully!"
else
  echo "⚠️  Some Date.now() still remain:"
  grep -rn "Date.now()" src/ --include="*.ts" --include="*.tsx" | grep -v "RainEffect"
fi

