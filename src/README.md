# Open Passive: Angluar

# Run first time

1. Let npm install all node_modules.

```console
npm i
```

2. Start the webpage

```
npm run start
```

in the log you can see a local website url. Often http://localhost:4200

# Your own design

ToDo

# Develop Angular Tips

## 1. Pages

We work with [pages](src/app/pages).

Add them also [the router](src/app/app.router.ts)

Makes sure you add all the [sections](src\app\components\enum.data.ts)

## 2. SVG's

Add a new group to the `SVG.html` and forloop

Makes sure you add to [the main model](src\app\house\passiveopen.ts)

[house.service](src\app\house\house.service.ts) should have the keys

## 3. Best practices

1. Use (behavoir)subjects as much as possible. Subscript with `| async`-pipes in the `HTML` and postfix the variable name with a `$`

2. Don't rename imports
   - :heavy_minus_sign: Don't: `private _cdr: ChangeDetectorRef`
   - :heavy_check_mark: Do: `private changeDetectorRef: ChangeDetectorRef`
