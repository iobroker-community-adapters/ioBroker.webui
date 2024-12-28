import { OpenScreen as OpenScreenDef, ScriptCommands } from "@node-projects/web-component-designer-visualization-addons";

//This class is used from script 
//reflection-scripts

export declare type WebuiScriptCommands = Exclude<ScriptCommands, OpenScreenDef> | OpenScreen | OpenScreenInScreenViewer; 

export interface OpenScreen extends Omit<OpenScreenDef, 'closeable'> { }

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