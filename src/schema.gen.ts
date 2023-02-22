/**
 * Copyright (c) Whales Corp. 
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs';
import { generate } from 'ton-tl/dist/gen';

let source = fs.readFileSync(__dirname + '/schema.tl', 'utf-8');
let generated = generate(source);
fs.writeFileSync(__dirname + '/schema.ts', generated);