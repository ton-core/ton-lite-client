import fs from 'fs';
import { generate } from 'ton-tl';

let source = fs.readFileSync(__dirname + '/schema.tl', 'utf-8');
let generated = generate(source);
fs.writeFileSync(__dirname + '/schema.ts', generated);