import { BaseCustomWebComponentConstructorAppend, html, css } from '@node-projects/base-custom-webcomponent';
export class IobrokerWebuiDynamicsEditorHistoric extends BaseCustomWebComponentConstructorAppend {
    static template = html `
        <span style="position:absolute;left:30px;top:26px;">from</span>
        <span style="position:absolute;left:30px;top:77px;">count</span>
        <span style="position:absolute;left:30px;top:123px;">limit</span>
        <span style="position:absolute;left:276.102px;top:24px;">include fields</span>
        <span style="position:absolute;left:30px;top:150px;">round</span>
        <span style="position:absolute;left:55px;top:181px;">return newest entries</span>
        <span style="position:absolute;left:55px;top:201px;">remove border values</span>
        <span style="position:absolute;left:30px;top:301px;">step</span>
        <span style="position:absolute;left:30px;top:270px;">aggregate</span>
        <span style="position:absolute;left:30px;top:227px;">ignore null</span>
        <input type="datetime-local" value="{{this.from}}" style="position:absolute;left:75.9219px;top:26px;width:184px;">
        <span style="position:absolute;left:31px;top:52px;">to</span>
        <input type="datetime-local" value="{{this.to}}" style="position:absolute;left:76px;top:51.4375px;width:184px;">
        <input type="number" value="{{this.count}}" style="position:absolute;left:76px;top:78.4415px;width:184px;">
        <input type="number" value="{{this.limit}}" style="position:absolute;left:76px;top:125.5px;width:184px;">
        <input type="number" value="{{this.round}}" style="position:absolute;left:76px;top:152px;width:184px;">
        <input type="number" style="position:absolute;left:76px;top:301px;width:184px;">
        <select style="position:absolute;left:142px;top:273px;width:118px;height:21px;">
            <option>none</option>
            <option>minmax</option>
            <option>max</option>
            <option>min</option>
            <option>average</option>
            <option>total</option>
            <option>count</option>
            <option>percentile</option>
            <option>quantile</option>
            <option>integral</option>
        </select>
        <select style="position:absolute;left:142px;top:230px;width:119px;height:21px;">
            <option>false</option>
            <option>true</option>
            <option>0</option>
        </select>
        <input type="checkbox" checked="{{this.returnNewestEntries}}" style="position:absolute;left:35px;top:184px;">
        <input type="checkbox" checked="{{this.removeBorderValues}}" style="position:absolute;left:35px;top:204px;">
        <div style="position:absolute;left:293px;top:54px;width:117px;height:154px;grid-template-columns:20px 1fr;display:grid;">
            <input type="checkbox">
            <span>from</span>
            <input type="checkbox">
            <span>ack</span>
            <input type="checkbox">
            <span>q</span>
            <input type="checkbox">
            <span>user</span>
            <input type="checkbox">
            <span>comment</span>
            <input type="checkbox">
            <span>id</span>
        </div>     
    `;
    static style = css `
        :host {
            box-sizing: border-box;
        }`;
    static is = 'iobroker-webui-dynamics-editor-historic';
    static properties = {};
}
customElements.define(IobrokerWebuiDynamicsEditorHistoric.is, IobrokerWebuiDynamicsEditorHistoric);
