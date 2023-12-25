import { OpenDialog, OpenScreen } from "../scripting/ScriptCommands";
export declare class Runtime {
    static openScreen(config: Omit<OpenScreen, 'type'>): Promise<void>;
    static openDialog(config: Omit<OpenDialog, 'type'>): Promise<void>;
}
