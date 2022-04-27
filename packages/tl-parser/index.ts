import {readFileSync} from "fs";
import {generate, ParserOptions} from "pegjs";
import {TLProgram} from "./ast";

const grammar = readFileSync(__dirname + '/tl_grammar.pegjs', 'utf-8')
const parser = generate(grammar)

export const parseTl = (str: string, options?: ParserOptions): TLProgram => {
    return parser.parse(str, options)
}