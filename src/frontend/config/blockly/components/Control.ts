//@ts-ignore
Blockly.Blocks['control'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('control');

        this.appendDummyInput('OID')
            //@ts-ignore
            .appendField(new Blockly.FieldObjectId('Object ID'), 'OID');

        this.appendValueInput('VALUE')
            .setCheck(null)
            .appendField('control_with');

        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
    }
};

//@ts-ignore
Blockly.JavaScript['control'] = function (block) {
    const valueObjectID = block.getFieldValue('OID');

    //@ts-ignore
    Blockly.Msg.VARIABLES_DEFAULT_NAME = 'value';

    let valueDelay = parseInt(block.getFieldValue('DELAY_MS'), 10);
    const unit = block.getFieldValue('UNIT');
    if (unit === 'min') {
        valueDelay *= 60000;
    } else if (unit === 'sec') {
        valueDelay *= 1000;
    }

    let clearRunning = block.getFieldValue('CLEAR_RUNNING');
    clearRunning = clearRunning === 'TRUE' || clearRunning === 'true' || clearRunning === true;

    //@ts-ignore
    const valueValue = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
    const withDelay = this.getFieldValue('WITH_DELAY');

    //@ts-ignore
    let objectName = main.objects[valueObjectID] && main.objects[valueObjectID].common && main.objects[valueObjectID].common.name ? main.objects[valueObjectID].common.name : '';
    if (typeof objectName === 'object') {
        //@ts-ignore
        objectName = objectName[systemLang] || objectName.en;
    }

    let code;
    if (withDelay === 'true' || withDelay === true || withDelay === 'TRUE') {
        code = `setStateDelayed('${valueObjectID}'${objectName ? ` /* ${objectName} */` : ''}, ${valueValue}, ${valueDelay}, ${clearRunning});\n`;
    } else {
        code = `setState('${valueObjectID}'${objectName ? ` /* ${objectName} */` : ''}, ${valueValue});\n`;
    }

    return code;
};