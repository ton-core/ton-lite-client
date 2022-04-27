export class CodeBuilder {
    private tabLevel = 0
    private code = ''

    tab() {
        this.tabLevel++
    }

    unTab() {
        this.tabLevel--
    }

    add(text?: string, moveLine = true) {
        if (!text) {
            this.code += '\n'
            return
        }

        let tab = ' '.repeat(this.tabLevel * 4)
        this.code += tab + text + (moveLine ? '\n' : '')
    }

    addMultiline(text: string, inline = false) {
        let lines = text.split('\n')
        let i = 0
        for (let line of lines) {
            if (line === '\n' && lines.indexOf(line) === lines.length - 1) {
                continue
            }
            if (inline && i === 0) {
                this.code += line + '\n'
            } else {
                this.add(line)
            }
            i++
        }
    }

    append(code: CodeBuilder) {
        this.addMultiline(code.render())
    }

    appendInline(code: CodeBuilder) {
        this.addMultiline(code.render(), true)
    }

    render() {
        return this.code
    }
}