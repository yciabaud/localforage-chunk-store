module.exports = Storage

var localforage = require('localforage')

function Storage (chunkLength, opts) {
  var self = this
  if (!(self instanceof Storage)) return new Storage(chunkLength, opts)
  if (!opts) opts = {}

  self.chunkLength = Number(chunkLength)
  if (!self.chunkLength) throw new Error('First argument must be a chunk length')

  this.closed = false
  this.length = Number(opts.length) || Number(opts.size) || Infinity

  if (this.length !== Infinity) {
    this.lastChunkLength = (this.length % this.chunkLength) || this.chunkLength
    this.lastChunkIndex = Math.ceil(this.length / this.chunkLength) - 1
  }

  if (!opts.name) opts.name = 'localforage-chunk-store'
  this.store = localforage.createInstance(opts)
}

Storage.prototype.put = function (index, buf, cb) {
  var self = this
  if (typeof cb !== 'function') cb = noop
  if (this.closed) return nextTick(cb, new Error('Storage is closed'))

  var isLastChunk = (index === self.lastChunkIndex)
  if (isLastChunk && buf.length !== self.lastChunkLength) {
    return nextTick(cb, new Error('Last chunk length must be ' + self.lastChunkLength))
  }
  if (!isLastChunk && buf.length !== self.chunkLength) {
    return nextTick(cb, new Error('Chunk length must be ' + self.chunkLength))
  }

  self.store.setItem(String(index), buf, cb)
}

Storage.prototype.get = function (index, opts, cb) {
  var self = this
  if (typeof opts === 'function') return self.get(index, null, opts)
  if (this.closed) return nextTick(cb, new Error('Storage is closed'))

  self.store.getItem(String(index), function (err, value) {
    if (!value) err = 'got null from localForage'
    if (err) return nextTick(cb, new Error('Chunk not found: ' + err))

    if (!opts) return nextTick(cb, null, value)
    var offset = opts.offset || 0
    var len = opts.length || (value.length - offset)
    nextTick(cb, null, value.slice(offset, len + offset))
  })
}

Storage.prototype.close = function (cb) {
  if (this.closed) return nextTick(cb, new Error('Storage is closed'))
  this.closed = true
  nextTick(cb, null)
}

Storage.prototype.destroy = function (cb) {
  if (this.closed) return nextTick(cb, new Error('Storage is closed'))
  this.closed = true
  this.store.clear()
  this.store = null
  nextTick(cb, null)
}

function nextTick (cb, err, val) {
  process.nextTick(function () {
    if (cb) cb(err, val && val && new Buffer(val))
  })
}

function noop () {}
