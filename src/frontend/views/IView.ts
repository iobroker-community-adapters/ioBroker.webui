import { IBinding } from "./IBinding";

export interface IView {
    name: string;
    html: string;
    bindings: IBinding[] ;//in components like 
    //style: string; //in a style tag a start
    //script: string; //in a script tag at start
}