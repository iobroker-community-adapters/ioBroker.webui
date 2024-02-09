//@ts-ignore
Blockly.Blocks['template_string'] = {
    init: function () {
        this.appendDummyInput()
            //@ts-ignore
            .appendField(new Blockly.FieldLabelSerializable("Text"), "NAME")
            //@ts-ignore
            .appendField(new Blockly.FieldTextInput("Test Text with {{aa}} and {{bb}}"), "TEXT");
        this.setInputsInline(false);
        this.setOutput(true, 'String');
        this.setColour(230);

        this._addedInputs = [];
        this._oldtext = "";
        this.setOnChange((changeEvent) => {
            let v = this.getFieldValue('TEXT');
            if (this._oldtext == v)
                return;
            this._oldtext = v;
            let m = /{{(.*?)}}/g
            let result: RegExpExecArray;

            let oldConnections = {};
            for (let i of this._addedInputs) {
                //@ts-ignore
                oldConnections[i] = (<Blockly.Block>this).getInput(i).connection.targetConnection;
                //@ts-ignore
                (<Blockly.Block>this).removeInput(i);
                // (<Blockly.Block>this).getDescendants();
                //(<Blockly.Block>this).set
            }
            this._addedInputs = [];
            while ((result = m.exec(v)) !== null) {
                let nm = result[1];
                if (!this._addedInputs.includes(nm)) {
                    this._addedInputs.push(nm);
                    //@ts-ignore
                    let ip = (<Blockly.Block>this).appendValueInput(nm)
                        .setCheck(null)
                        //@ts-ignore
                        .setAlign(Blockly.ALIGN_RIGHT)
                        .appendField(nm);
                    if (oldConnections[nm]) {
                        //@ts-ignore
                        (<Blockly.Connection>oldConnections[nm]).connect(ip.connection);
                    }
                }
            }
        });
    },
    saveExtraState: function () {
        return {
            'inputs': this._addedInputs,
        };
    },
    loadExtraState: function (state) {
        this._addedInputs = state['inputs'] ?? [];
        for (let nm of this._addedInputs) {
            this.appendValueInput(nm)
                .setCheck(null)
                //@ts-ignore
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField(nm);
        }
    },
};

//@ts-ignore
Blockly.JavaScript['template_string'] = function (block, generator) {
    //@ts-ignore
    const text = block.getFieldValue('TEXT');
    let code = `\`${text}\``;
    for (let i of block._addedInputs) {
        //@ts-ignore
        const nm = Blockly.JavaScript.valueToCode(block, i, Blockly.JavaScript.ORDER_ATOMIC);
        code += `.replaceAll('{{${i}}}', ${nm})`;
    }
    //@ts-ignore
    return [code, Blockly.JavaScript.ORDER_NONE];
};