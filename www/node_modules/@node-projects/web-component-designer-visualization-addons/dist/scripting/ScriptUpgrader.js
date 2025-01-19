//For upgradeing changed script commands
export class ScriptUpgrades {
    static upgradeScriptCommand(scriptCommand) {
        if (scriptCommand.type === 'SetElementProperty') {
            return ScriptUpgrades.upgradeSetElementProperty(scriptCommand);
        }
        return scriptCommand;
    }
    static upgradeSetElementProperty(scriptCommand) {
        if (scriptCommand.targetSelectorTarget === 'currentScreen') {
            scriptCommand.targetSelectorTarget = 'container';
        }
        else if (scriptCommand.targetSelectorTarget === 'parentScreen') {
            scriptCommand.targetSelectorTarget = 'container';
            scriptCommand.parentIndex = 1;
        }
        else if (scriptCommand.targetSelectorTarget === 'currentElement') {
            scriptCommand.targetSelectorTarget = 'element';
        }
        else if (scriptCommand.targetSelectorTarget === 'parentElement') {
            scriptCommand.targetSelectorTarget = 'element';
            scriptCommand.parentIndex = 1;
        }
        return scriptCommand;
    }
}
