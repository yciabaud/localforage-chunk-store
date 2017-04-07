# localForage-chunk-store [![CircleCI](https://circleci.com/gh/yciabaud/localforage-chunk-store.svg?style=svg)](https://circleci.com/gh/yciabaud/localforage-chunk-store)

#### [localForage](https://github.com/mozilla/localForage) persistent browser chunk store that is [abstract-chunk-store](https://github.com/mafintosh/abstract-chunk-store) compliant

## Install

```
npm install localforage-chunk-store
```

## Usage

``` js
var LocalForageChunkStore = require('localforage-chunk-store')
var chunks = new LocalForageChunkStore(chunkLength, [opts])

chunks.put(0, new Buffer('01234567890'), function (err) {
  if (err) throw err
  chunks.get(0, function (err, chunk) {
    if (err) throw err
    console.log(chunk) // '01234567890' as a buffer
  })
})
```

## License

MIT. Copyright (c) [Yoann Ciabaud](http://yoann-ciabaud.fr).
