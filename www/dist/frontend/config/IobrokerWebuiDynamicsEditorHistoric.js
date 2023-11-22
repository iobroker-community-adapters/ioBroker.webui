import { BaseCustomWebComponentConstructorAppend, html, css } from '@node-projects/base-custom-webcomponent';
export class IobrokerWebuiDynamicsEditorHistoric extends BaseCustomWebComponentConstructorAppend {
    static template = html `
        <span style="position:absolute;left:31.570300000000003px;top:26px;">from</span>
        <span style="position:absolute;left:30.6367px;top:77.7188px;">count</span>
        <span style="position:absolute;left:30.8867px;top:123px;">limit</span>
        <span style="position:absolute;left:30.8359px;top:150px;">round</span>
        <span style="position:absolute;left:55.652325px;top:181px;">return newest entries</span>
        <span style="position:absolute;left:54.249959999999994px;top:201px;">remove border values</span>
        <span style="position:absolute;left:341px;top:24px;">from</span>
        <span style="position:absolute;left:341px;top:47px;">ack</span>
        <span style="position:absolute;left:341px;top:68px;">q</span>
        <span style="position:absolute;left:341px;top:89px;">user</span>
        <span style="position:absolute;left:340px;top:116px;">comment</span>
        <span style="position:absolute;left:341px;top:139px;">id</span>
        <span style="position:absolute;left:31.1289px;top:301px;">step</span>
        <span style="position:absolute;left:30.6367px;top:274px;">aggregate</span>
        <span style="position:absolute;left:32.14842px;top:224px;">ignore null</span>
        <input type="datetime-local" style="position:absolute;left:76px;top:26px;">
        <span style="position:absolute;left:31.125px;top:52.5px;">to</span>
        <input type="datetime-local" style="position:absolute;left:76px;top:51.4375px;">
        <input type="number" value="500" style="position:absolute;left:75.8438px;top:78.4415px;width:172px;">
        <input type="number" style="position:absolute;left:76.0938px;top:125px;width:172px;">
        <input type="number" style="position:absolute;left:76.043px;top:152px;width:172px;">
        <input type="number" style="position:absolute;left:75.211px;top:301px;width:172px;">
        <select style="position:absolute;left:141.656px;top:273px;width:113px;height:21px;">
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
        <select style="position:absolute;left:143.16772px;top:223px;width:113px;height:21px;">
            <option>false</option>
            <option>true</option>
            <option>0</option>
        </select>
        <input type="checkbox" style="position:absolute;left:35.06200000000001px;top:184px;">
        <input type="checkbox" style="position:absolute;left:33.659659999999995px;top:204px;">
        <input type="checkbox" style="position:absolute;left:321px;top:26px;">
        <input type="checkbox" style="position:absolute;left:320px;top:49px;">
        <input type="checkbox" style="position:absolute;left:320px;top:70px;">
        <input type="checkbox" style="position:absolute;left:320px;top:91px;">
        <input type="checkbox" style="position:absolute;left:320px;top:118px;">
        <input type="checkbox" style="position:absolute;left:320px;top:141px;">
    `;
    static style = css `
        :host {
            box-sizing: border-box;
        }`;
    static is = 'iobroker-webui-dynamics-editor-historic';
    static properties = {};
}
customElements.define(IobrokerWebuiDynamicsEditorHistoric.is, IobrokerWebuiDynamicsEditorHistoric);
