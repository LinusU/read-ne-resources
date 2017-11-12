# Read NE Resources

Read resources from [New Executables](https://en.wikipedia.org/wiki/New_Executable).

## Installation

```sh
npm install --save read-ne-resources
```

## Usage

```js
const readNEResources = require('read-ne-resources')
const fs = require('fs')

const data = fs.readFileSync('SIMTOWER.EXE')
const resources = readNEResources(data)

console.log(resources[5])
//=> {
//   id: 128,
//   typeId: 32770,
//   type: 'BITMAP',
//   flags: 3120,
//   data: Uint8Array [...]
// }
```
