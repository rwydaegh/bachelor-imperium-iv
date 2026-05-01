# Album photos

Drop `.jpg` / `.png` files in this folder, then list their filenames in
`index.json` like:

```json
["jeroen_baby.jpg", "tournament_2019.png", "ardennes.jpg"]
```

The projector view fetches `index.json` on load and slowly cycles through the
listed photos as the scoreboard backdrop. Empty array = no slideshow (just a
plain dark background, fine).

You can drop new files in mid-weekend — refresh the projector page to pick
them up.
