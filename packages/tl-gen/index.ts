import {readFileSync, writeFileSync} from "fs";
import * as crc from "crc-32";
import {parseTl} from "../tl-parser";
import {CodeBuilder} from "./CodeBuilder";
import {CombinatorDeclaration, ETypeIdentifier, OptionalVariableIdentifier} from "../tl-parser/ast";

const schema = readFileSync(__dirname + '/test.tl', 'utf-8')
const schemaLines = schema.split('\n')
const ast = parseTl(schema)

const IgnoreList = [
    'true',
    'bytes',
    'boolTrue',
    'boolFalse',
    'vector',
    'int128',
    'int256'

]

function normalizeName(name: string) {
    return name.replaceAll('.', '_')
}

function getTypeName(id: ETypeIdentifier) {
    if (id.id.name === 'string') {
        return 'Buffer'
    }
    if (id.id.name === 'int256') {
        return 'Buffer'
    }
    if (id.id.name === 'int') {
        return 'number'
    }
    if (id.id.name === 'bytes') {
        return 'Buffer'
    }
    if (id.id.name === 'long') {
        return 'bigint'
    }
    if (id.id.name === '#') {
        return 'number'
    }

    return normalizeName(id.id.name)
}

function getEncoderFnForType(id: OptionalVariableIdentifier, type: ETypeIdentifier) {
    if (type.id.name === 'string') {
        return `encoder.writeBuff(this.${id.name})`
    }
    if (type.id.name === 'int256') {
        return `encoder.writeInt256Buff(this.${id.name})`
    }
    if (type.id.name === 'int') {
        return `encoder.writeInt32(this.${id.name})`
    }
    if (type.id.name === 'bytes') {
        return `encoder.writeBuff(this.${id.name})`
    }
    if (type.id.name === 'long') {
        return `encoder.writeInt64(this.${id.name})`
    }
    if (type.id.name === '#') {
        return `encoder.writeInt32(this.${id.name})`
    }
    return `encoder.writeType(this.${id.name})`
    // throw new Error('Unknown type')
    // return id.id.name
}

function getDecoderFnForType(id: OptionalVariableIdentifier, type: ETypeIdentifier) {
    if (type.id.name === 'string') {
        return `let ${id.name} = decoder.readBuff()`
    }
    if (type.id.name === 'int256') {
        return `let ${id.name} = decoder.readInt256Buff()`
    }
    if (type.id.name === 'int') {
        return `let ${id.name} = decoder.readInt32()`
    }
    if (type.id.name === 'bytes') {
        return `let ${id.name} = decoder.readBuff()`
    }
    if (type.id.name === 'long') {
        return `let ${id.name} = decoder.readInt64()`
    }
    if (type.id.name === '#') {
        return `let ${id.name} = decoder.readInt32()`
    }
    return `let ${id.name} = decoder.readType(${normalizeName(type.id.name)})`
    // throw new Error('Unknown type')
    // return id.id.name
}

function genType(decl: CombinatorDeclaration, typeId: number) {
    let code = new CodeBuilder()


    code.add(`export class ${normalizeName(decl.id.name)} extends TlType {`)
    code.tab()
    code.add(`static typeId = ${typeId}`)
    code.add()

    let fields: string[] = []

    for (let field of decl.args) {
        if (field.argType.expression.type !== 'ETypeIdentifier') {
            continue
        }
        fields.push(`public ${field.id.name}: ${getTypeName(field.argType.expression)}`)
    }

    code.add(`constructor(${fields.join(', ')}) {`)
    code.tab()
    code.add('super()')
    code.unTab()
    code.add('}')
    code.add()


    code.add(`getId = () => ${typeId}`)
    code.add()

    code.add(`encode = (encoder: TlWriteBuffer) => {`)

    code.tab()

    for (let field of decl.args) {
        if (field.argType.expression.type !== 'ETypeIdentifier') {
            continue
        }
        code.add(getEncoderFnForType(field.id, field.argType.expression))
    }
    code.unTab()
    code.add('}')

    code.add()
    code.add('static decode = (decoder: TlReadBuffer) => {')
    code.tab()
    let fs: string[] = []
    for (let field of decl.args) {
        if (field.argType.expression.type !== 'ETypeIdentifier') {
            continue
        }
        fs.push(field.id.name)
        code.add(getDecoderFnForType(field.id, field.argType.expression))
    }
    code.add(`return new ${normalizeName(decl.id.name)}(${fs.join(', ')})`)
    code.unTab()
    code.add('}')

    code.unTab()
    code.add('}')

    return code
}


let code = new CodeBuilder()

code.add('import {TlWriteBuffer, TlReadBuffer} from "../tl/TlBuffer";')
code.add('import {TlType} from "../tl/TlType";')
code.add()

for (let constructor of ast.constructors.declarations) {
    let declLine = schemaLines[constructor.start.line - 1]
    let typeId = crc.str(declLine.slice(0, -1))



    if (constructor.type === 'CombinatorDeclaration') {
        if (IgnoreList.includes(constructor.id.name)) {
            continue
        }
        // console.log(constructor)
        code.append(genType(constructor, typeId))
        code.add()
    }
}

for (let constructor of ast.functions.declarations) {
    let declLine = schemaLines[constructor.start.line - 1]
    let typeId = crc.str(declLine.slice(0, -1))



    if (constructor.type === 'CombinatorDeclaration') {
        if (IgnoreList.includes(constructor.id.name)) {
            continue
        }
        // console.log(constructor)
        code.append(genType(constructor, typeId))
        code.add()
    }
}

writeFileSync(__dirname + '/out.ts', code.render())