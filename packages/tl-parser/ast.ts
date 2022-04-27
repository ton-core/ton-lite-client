export type TLProgram = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'TLProgram',
    constructors: ConstructorDeclarations,
    functions: FunctionDeclarations,
    // comments: Comment[] // TODO
}

// export type Comment = {

//   type: 'Comment',
//   value: string
// }

export type ConstructorDeclarations = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'ConstructorDeclarations',
    declarations: Declaration[]
}

export type FunctionDeclarations = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'FunctionDeclarations',
    declarations: Declaration[]
}

export type Declaration =
    | CombinatorDeclaration
    | BuiltinCombinatorDeclaration
    | PartialApplicationDeclaration
    | FinalDeclaration

export type CombinatorDeclaration = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'CombinatorDeclaration',
    id: FullCombinatorIdentifier,
    optionalArgs: OptionalArgument[],
    args: Argument[],
    bang: boolean,
    resultType: ResultType
}

export type PartialApplicationDeclaration =
    | PartialTypeApplicationDeclaration
    | PartialCombinatorApplicationDeclaration

export type PartialTypeApplicationDeclaration = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'PartialTypeApplicationDeclaration',
    expression: EExpression
}

export type PartialCombinatorApplicationDeclaration = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'PartialCombinatorApplicationDeclaration',
    id: CombinatorIdentifier,
    expression: EExpression
}

export type FinalDeclaration = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'FinalDeclaration',
    finalization: 'New' | 'Final' | 'Empty',
    id: BoxedTypeIdentifier
}

export type FullCombinatorIdentifier = // CombinatorIdentifier with magic
    | FullCombinatorName
    | CombinatorIdentifier

export type CombinatorIdentifier =
    | ShortCombinatorName
    | EmptyCombinatorName

export type FullCombinatorName = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'FullCombinatorName',
    name: string, // optional namespace + lc name
    magic: string // /[0-9a-f]{4,8}/
}

export type ShortCombinatorName = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'ShortCombinatorName',
    name: string // optional namespace + lc name
}

export type EmptyCombinatorName = { // underscore
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'EmptyCombinatorName',
    name: string // '_'
}

export type TypeIdentifier = // [ns .] lc / [ns .] uc / #
    | BoxedTypeIdentifier
    | SimpleTypeIdentifier
    | HashTypeIdentifier

export type BoxedTypeIdentifier = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'BoxedTypeIdentifier',
    name: string // uc with optional ns
}

export type SimpleTypeIdentifier = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'SimpleTypeIdentifier',
    name: string // lc with optional ns
}

export type HashTypeIdentifier = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'HashTypeIdentifier',
    name: string // '#'
}

export type OptionalVariableIdentifier =
    | VariableIdentifier
    | EmptyVariableIdentifier

export type VariableIdentifier = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'VariableIdentifier',
    name: string // lc / uc
}

export type EmptyVariableIdentifier = { // underscore
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'EmptyVariableIdentifier',
    name: string // '_'
}

export type TypeExpression = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'TypeExpression',
    expression: Expression
}

export type NatExpression = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'NatExpression',
    expression: Expression
}

export type Expression =
    | ETypeIdentifier
    // | EVariableIdentifier
    | ENat
    | EOperator
    | EExpression
    | EMultiArg

export type ETypeIdentifier = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'ETypeIdentifier',
    id: TypeIdentifier
}

// export type EVariableIdentifier = {

//   type: 'EVariableIdentifier'
//   id: VariableIdentifier
// }

export type ENat = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'ENat',
    value: number
}

export type EOperator = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'EOperator',
    kind: '%' | '!' | '+',
    expression: Expression
}

export type EExpression = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'EExpression',
    subexpressions: Expression[]
}

export type EMultiArg = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'EMultiArg',
    multiplicity: NatExpression | null,
    subargs: Argument[]
}

// export type TypeTerm = {

//   type: 'TypeTerm',
//   term: Term
// }
//
// export type NatTerm = {

//   type: 'NatTerm',
//   term: Term
// }

export type OptionalArgument = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'OptionalArgument',
    id: VariableIdentifier,
    argType: TypeExpression
}

export type Argument = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'Argument',
    id: OptionalVariableIdentifier,
    conditionalDef: ConditionalDefinition | null,
    argType: TypeExpression
}

export type ConditionalDefinition = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'ConditionalDefinition',
    id: VariableIdentifier,
    nat: number | null
}

export type ResultType = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'ResultType',
    id: BoxedTypeIdentifier,
    expression: EExpression
}

export type BuiltinCombinatorDeclaration = {
    start: { offset: number, line: number, column: number },
    end: { offset: number, line: number, column: number },
    type: 'BuiltinCombinatorDeclaration',
    id: FullCombinatorIdentifier,
    result: BoxedTypeIdentifier
}
