# Gem Weaver Dash

## Game Rules

### Catching Items

* Tap the grid to move the Unicorn
* The Unicorn dashes to the tapped position and catches items on the path
* Each gem that is caught is added directly to inventory
* Gems never appear in orbit
* Each fruit that is caught is staged in the Unicorn orbit
* Fruits stay in orbit until there are 3 staged of the same kind
* Every 3 staged fruits of the same kind convert into 1 inventory fruit

### Spells

* Fruits and Gems can be used in spells
* There are 2 spells: ADD, SUB
* ADD adds colors together
* SUB subtracts colors
* Placing an item into a spell space deducts it from inventory immediately
* Replacing an item in a spell space returns the previous item to inventory
* Pressing a spell button activates the spell
* The result is always a gem
* During spell animation, all interactions are locked:
* No Unicorn movement
* No inventory interaction
* No spell casting
* After animation resolves, the resulting gem is added to inventory

### Winning

* Win by obtaining the 7 rainbow gems: R, O, Y, G, C, B, V
* Black and white gems do not count toward winning

### Level Lessons

1. Collect gems or 7 rainbow colors
2. Use ADD to combina 2 colors
3. Combine a color with itself to get a gem of the same color
4. Combining gems is also possible; some items are not important
5. Combining fruits and gems is possible
6. Black + any color = Color
7. Subtract colors easy
8. Subtract + Add colors
9. Complement colors using white
10. Complement + addition

## Achievements

Possible ideas for achievements, if we get to that stage...

* First Dash
* Fruitful - Caught 4 fruits in a single dash
* Cornucopia - Have one of each fruit in inventory
* Ying - Get a black gem
* Yang - Get a white gem
* Ouch - Die in the spikes
* Spash - Drown in the water
* Hoarder - have 3 of a kind of gem

## TODO

* BUG: Help text too big or out of bounds on mobile
* The backgroud color of the gem slots should always be shown
* Hide subtract button until it's needed
* Turn text rendering from background image based to masks
