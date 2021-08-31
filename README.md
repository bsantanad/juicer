# juicer

3d modelling software made with webgl

## installation

just `git clone` the repo and open `index.html` in a browser

## usage

### draw something

in order to do anything you'll need a colour file and a polygon file. These
files are just plain text that contains the position of the vertices

Ex.

```
0,0,0
0,150,0
150,150,0
```

You can add comments to both your colour files and object files
```
// this is the base
0,0, 0
0,  150,0
  150,150,0
```
you can even add spaces and it will still read them just fine

**note:** be sure to save them with the extensions `.co` for colours and `.ob`
for polygons.

if you want to see some examples go over the `colors` dir and the `polygons`
dir here in the repo

### transform things

you can use the  sliders to move things, make them smaller, etc..

## acknowledge

it was done based on the great lessons of [web
fundamentals](https://webglfundamentals.org/)
