require('./global-leakage.js')

var os = require('os')
var fs = require('fs')
var path = require('path')
var test = require('tap').test

// pretend to be Windows
process.platform = 'win32'
// load glob before patching fs
var glob = require('../')

var originalStat = fs.stat
fs.stat = function (path, cb) {
  return originalStat(getRealPath(path), cb)
}

var originalReaddir = fs.readdir
fs.readdir = function (path, cb) {
  return originalReaddir(getRealPath(path), cb)
}

var originalStatSync = fs.statSync
fs.statSync = function (path) {
  return originalStatSync(getRealPath(path))
}

var originalReaddirSync = fs.readdirSync
fs.readdirSync = function (path) {
  return originalReaddirSync(getRealPath(path))
}

// Use unmodified paths if REAL_FS is set
var getRealPath = process.env.REAL_FS ? function (p) { return p } : translatePath;

function translatePath (p) {
  // Translate C:\glob-test into __dirname
  p = p.replace(/^c:\/glob-test(?=\/|$)/i, __dirname)
  // Translate \\hostname\glob-test into __dirname
  var uncPattern = '^//{2}' + os.hostname() + '/glob-test(?=/|$)'
  p = p.replace(new RegExp(uncPattern, 'i'), __dirname)
  return p
}

test('glob doesn\'t choke on UNC paths', function (t) {
  var uncRoot = '//' + os.hostname() + '/glob-test'
  var expect = [uncRoot + '/a/c', uncRoot + '/a/cb']

  var results = glob(uncRoot + '/a/c*', function (er, results) {
    if (er)
      throw er

    t.same(results, expect)
    t.end()
  })
})
