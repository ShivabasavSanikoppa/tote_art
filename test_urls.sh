#!/bin/bash
urls=(
  "https://images.unsplash.com/photo-1541961017774-22349e4a1262"
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f"
  "https://images.unsplash.com/photo-1582201942988-13e60e4556ee"
  "https://images.unsplash.com/photo-1560961817-2dbdbfb0dc4b"
  "https://images.unsplash.com/photo-1559868725-b8296eb8d58c"
  "https://images.unsplash.com/photo-1601058269553-90d5bcdd926b"
  "https://images.unsplash.com/photo-1514197316523-2895f32ebf26"
  "https://images.unsplash.com/photo-1582455584556-9d10cba7a956"
  "https://images.unsplash.com/photo-1581896791244-66ee758d4a99"
  "https://images.unsplash.com/photo-1614728263952-84ea256f9679"
)

for url in "${urls[@]}"; do
  echo -n "$url: "
  curl -s -o /dev/null -w "%{http_code}\n" "$url"
done
