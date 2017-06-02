// base-x encoding
// Forked from https://github.com/cryptocoinjs/bs58
// Originally written by Mike Hearn for BitcoinJ
// Copyright (c) 2011 Google Inc
// Ported to JavaScript by Stefan Thomas
// Merged Buffer refactorings from base58-native by Stephen Pair
// Copyright (c) 2013 BitPay Inc

var Buffer = require('safe-buffer').Buffer

module.exports = function base (ALPHABET) {
  var ALPHABET_MAP = {}
  var BASE = ALPHABET.length

  // pre-compute lookup table
  for (var z = 0; z < ALPHABET.length; z++) {
    var x = ALPHABET[z]

    if (ALPHABET_MAP[x] !== undefined) throw new TypeError(x + ' is ambiguous')
    ALPHABET_MAP[x] = z
  }

  function encode (source, delimiter) {
    if (delimiter === undefined) delimiter = ''
    else delimiter = delimiter.toString()
    if (source.length === 0) return ''

    var digits = [0]
    for (var i = 0; i < source.length; ++i) {
      for (var j = 0, carry = source[i]; j < digits.length; ++j) {
        carry += digits[j] << 8
        digits[j] = carry % BASE
        carry = (carry / BASE) | 0
      }

      while (carry > 0) {
        digits.push(carry % BASE)
        carry = (carry / BASE) | 0
      }
    }

    var string = ''

    // deal with leading zeros
    for (var k = 0; source[k] === 0 && k < source.length - 1; ++k) string += delimiter + ALPHABET[0]
    // convert digits to a string
    for (var q = digits.length - 1; q >= 0; --q) string += delimiter + ALPHABET[digits[q]]

    return delimiter ? string.substring(1) : string
  }

  function decodeUnsafe (string) {
    var stringLen = string.length
    if (stringLen === 0) return Buffer.allocUnsafe(0)

    var paddingBytes = []
    var dataBytes = []
    var byteLen = 0
    var isPadding = true

    for (var i = 0; i < stringLen; i++) {
      var c = string[i]
      var value = ALPHABET_MAP[c]

      var noValue = value === undefined
      for (; noValue && i < stringLen;) {
        c += string[++i]
        value = ALPHABET_MAP[c]
        noValue = value === undefined
      }
      if (noValue) return

      if (isPadding) {
        if (!value) {
          paddingBytes.push(0)
          continue
        }
        isPadding = false
        byteLen = dataBytes.push(0)
      }

      for (var j = 0, carry = value; j < byteLen; ++j) {
        carry += dataBytes[j] * BASE
        dataBytes[j] = carry & 0xff
        carry >>= 8
      }

      while (carry > 0) {
        byteLen = dataBytes.push(carry & 0xff)
        carry >>= 8
      }
    }

    return Buffer.from(paddingBytes.concat(dataBytes.reverse()))
  }

  function decode (string) {
    var buffer = decodeUnsafe(string)
    if (buffer) return buffer

    throw new Error('Non-base' + BASE + ' character')
  }

  return {
    encode: encode,
    decodeUnsafe: decodeUnsafe,
    decode: decode
  }
}
