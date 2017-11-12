const types = new Map([
  [1, 'CURSOR'],
  [2, 'BITMAP'],
  [3, 'ICON'],
  [4, 'MENU'],
  [5, 'DIALOG'],
  [6, 'STRING'],
  [7, 'FONTDIR'],
  [8, 'FONT'],
  [9, 'ACCELERATOR'],
  [10, 'RCDATA'],
  [11, 'MESSAGETABLE'],
  [12, 'GROUP_CURSOR'],
  [14, 'GROUP_ICON'],
  [16, 'VERSION'],
  [17, 'DLGINCLUDE'],
  [19, 'PLUGPLAY'],
  [20, 'VXD'],
  [21, 'ANICURSOR'],
  [22, 'ANIICON'],
  [23, 'HTML'],
  [24, 'MANIFEST']
])

/**
 * @param {ArrayBuffer|Uint8Array} data
 * @returns {DataView}
 */
function toDataView (data) {
  if (data instanceof Uint8Array) {
    return new DataView(data.buffer, data.byteOffset, data.byteLength)
  }

  if (data instanceof ArrayBuffer) {
    return new DataView(data)
  }

  throw new TypeError('Expected `data` to be an ArrayBuffer or Uint8Array')
}

/**
 * @typedef Resouce
 * @property {string|number} id
 * @property {number} typeId
 * @property {string} type
 * @property {number} flags
 * @property {Uint8Array} data
 */

/**
 * @param {ArrayBuffer|Uint8Array} data
 * @returns {Resouce[]}
 */
module.exports = function readNEResources (data) {
  const view = toDataView(data)

  const windowsHeaderOffset = view.getUint32(0x3C, true)
  const resourceTableOffset = view.getUint16(windowsHeaderOffset + 0x24, true)
  const logicalSectorAlignment = view.getUint16(windowsHeaderOffset + 0x32, true)

  function readString (offset) {
    const length = view.getInt8(windowsHeaderOffset + resourceTableOffset + offset)

    return Array.from({ length }, (_, idx) => {
      return String.fromCharCode(view.getInt8(windowsHeaderOffset + resourceTableOffset + offset + idx + 1))
    }).join('')
  }

  function readType (input) {
    return (input & 0x8000) ? (types.get(input & 0x7FFF) || 'UNKNOWN') : readString(input)
  }

  function readResouceId (input) {
    return (input & 0x8000) ? (input & 0x7FFF) : readString(input)
  }

  let result = []
  let position = (windowsHeaderOffset + resourceTableOffset + 2)

  while (position < view.byteLength) {
    const typeId = view.getUint16(position, true); position += 2
    const count = view.getUint16(position, true); position += 2

    if (typeId === 0) break

    const type = readType(typeId)

    // Skip 4 bytes
    position += 4

    for (let idx = 0; idx < count; idx++) {
      const alignedOffset = view.getUint16(position, true); position += 2
      const alignedLength = view.getUint16(position, true); position += 2

      const offset = alignedOffset << logicalSectorAlignment
      const length = alignedLength << logicalSectorAlignment

      const flags = view.getUint16(position, true); position += 2
      const id = view.getUint16(position, true); position += 2

      // Skip 4 bytes
      position += 4

      // Read resource data
      const data = new Uint8Array(view.buffer, view.byteOffset + offset, length)

      result.push({ id: readResouceId(id), typeId, type, flags, data })
    }
  }

  return result
}
