module.exports = Storage

var localforage = require('localforage')
var nextTick = require('next-tick')
var Buffer = require('buffer').Buffer

function Storage (chunkLength, opts) {
  if (!(this instanceof Storage)) return new Storage(chunkLength, opts)
  if (!opts) opts = {}

  this.chunkLength = Number(chunkLength)
  if (!this.chunkLength) throw new Error('First argument must be a chunk length')

  this.closed = false
  this.length = Number(opts.length) || Infinity

  if (this.length !== Infinity) {
    this.lastChunkLength = (this.length % this.chunkLength) || this.chunkLength
    this.lastChunkIndex = Math.ceil(this.length / this.chunkLength) - 1
  }

  if (!opts.name) opts.name = 'localforage-chunk-store'
  this.store = localforage.createInstance(opts)
}

Storage.prototype.put = function (index, buf, cb) {
  if (typeof cb !== 'function') cb = noop
  if (this.closed) return tick(cb, new Error('Storage is closed'))

  var isLastChunk = (index === this.lastChunkIndex)
  if (isLastChunk && buf.length !== this.lastChunkLength) {
    return tick(cb, new Error('Last chunk length must be ' + this.lastChunkLength))
  }
  if (!isLastChunk && buf.length !== this.chunkLength) {
    return tick(cb, new Error('Chunk length must be ' + this.chunkLength))
  }

  this.store.setItem(String(index), buf)
    .then(noop)
    .then(cb, cb)
}

Storage.prototype.get = function (index, opts, cb) {
  if (typeof opts === 'function') return this.get(index, null, opts)
  if (this.closed) return tick(cb, new Error('Storage is closed'))

  this.store.getItem(String(index))
    .then(function (value) {
      if (!value) {
        throw new Error('got null from localForage')
      }
      if (!opts) return tick(cb, null, value)
      var offset = opts.offset || 0
      var len = opts.length || (value.length - offset)
      return tick(cb, null, value.slice(offset, len + offset))
    })
    .catch(function (err) {
      return tick(cb, new Error('Chunk not found: ' + err))
    })
}

Storage.prototype.close = function (cb) {
  if (this.closed) return tick(cb, new Error('Storage is closed'))
  this.closed = true
  tick(cb, null)
}

Storage.prototype.destroy = function (cb) {
  if (this.closed) return tick(cb, new Error('Storage is closed'))
  this.closed = true
  this.store.clear()
  this.store = null
  tick(cb, null)
}

function tick (cb, err, val) {
  nextTick(function () {
    if (cb) cb(err, val && Buffer.from(val))
  })
}

function noop () {}
