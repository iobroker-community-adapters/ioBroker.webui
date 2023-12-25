export function escapeCData(text) {
    return text.replaceAll("]]>", "]]]]><![CDATA[>");
}
export function parseXml(xml) {
    let doc = new DOMParser().parseFromString(xml, "text/xml");
    let obj = {};
    for (let childNode of doc.children[0].children) {
        let tx = childNode.textContent;
        if (tx[0] === '\n' && tx.endsWith('\n'))
            tx = tx.substring(1, tx.length - 2);
        else if (tx[0] === '\n')
            tx = tx.substring(1);
        else if (tx.endsWith('\n'))
            tx = tx.substring(0, tx.length - 1);
        obj[childNode.nodeName] = tx;
    }
    return obj;
}
export function screenToXml(screen) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += "<screen>\n";
    if (screen.html) {
        xml += "    <html><![CDATA[\n";
        xml += escapeCData(screen.html);
        xml += "\n]]></html>\n";
    }
    if (screen.style) {
        xml += "    <style><![CDATA[\n";
        xml += escapeCData(screen.style);
        xml += "\n]]></style>\n";
    }
    if (screen.settings && Object.getOwnPropertyNames(screen.settings).length) {
        xml += "    <settings>\n";
        for (let p in screen.settings) {
            xml += "        <" + p + ">" + screen.settings[p] + "</" + p + ">\n";
        }
        xml += "</settings>\n";
    }
    xml += "</screen>\n";
    return xml;
}
export function controlToXml(control) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += "<control>\n";
    if (control.html) {
        xml += "    <html><![CDATA[\n";
        xml += escapeCData(control.html);
        xml += "\n]]></html>\n";
    }
    if (control.style) {
        xml += "    <style><![CDATA[\n";
        xml += escapeCData(control.style);
        xml += "\n]]></style>\n";
    }
    if (control.properties && Object.getOwnPropertyNames(control.properties).length) {
        xml += "    <properties>\n";
        for (let p in control.properties) {
            xml += `        <property name="${p}" default="${control.properties[p].default}" values="${control.properties[p].values.join('|')}">\n`;
        }
        xml += "\n</properties>\n";
    }
    if (control.settings && Object.getOwnPropertyNames(control.settings).length) {
        xml += "    <settings>\n";
        for (let p in control.settings) {
            xml += "        <" + p + ">" + control.settings[p] + "</" + p + ">\n";
        }
        xml += "</settings>\n";
    }
    xml += "</control>\n";
    return xml;
}
