import { OpenScreen as OpenScreenDef, OpenDialog as OpenDialogDef, ScriptCommands } from "@node-projects/web-component-designer-visualization-addons";

//This class is used from script 
//reflection-scripts

export declare type WebuiScriptCommands = Exclude<Exclude<ScriptCommands, OpenScreenDef>, OpenDialogDef> | OpenScreen | OpenDialog | OpenScreenInScreenViewer;

export interface OpenScreen extends Omit<OpenScreenDef, 'closeable'> { }

export interface OpenDialog extends OpenDialogDef {
  /**
   * css class to apply to dialog
   */
  cssClass: string;
}

export interface OpenScreenInScreenViewer {
  type: 'OpenScreenInScreenViewer';

  /**
   * Name of the Screen
   * @TJS-format screen
   */
  screen: string;
  title?: string;
  /**
   * If signals in screen are defined relative (starting with a '.'), this will be prepended
   */
  relativeSignalsPath?: string;
  /**
   * css selector to find the screenviewer in the root screen
   * @default iobroker-webui-screen-viewer
   */
  targetSelector: string;
  additionalData?: string;
}