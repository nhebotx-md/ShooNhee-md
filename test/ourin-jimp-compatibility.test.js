import assert from 'node:assert/strict'
import { BlendMode, Jimp, JimpMime } from 'jimp'
import test from 'node:test'
import { drawBoard } from '../src/lib/Shon-game-ulartangga.js'

test('adapter permainan memakai surface Jimp 1.x yang kompatibel', () => {
  assert.equal(typeof Jimp.read, 'function')
  assert.equal(typeof JimpMime.png, 'string')
  assert.equal(typeof BlendMode.SRC_OVER, 'string')
  assert.equal(typeof drawBoard, 'function')
})
