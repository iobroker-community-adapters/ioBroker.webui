export function escapeCData(text) {
    return text.replaceAll("]]>", "]]]]><![CDATA[>");
}
export function escapeXml(text) {
    return text.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
        return null;
    });
}
export function parseXml(xml) {
    let doc = new DOMParser().parseFromString(xml, "text/xml");
    let obj = {};
    for (let childNode of doc.children[0].children) {
        if (childNode.nodeName == 'properties') {
            obj.properties = {};
            for (let p of childNode.children) {
                let prp = {
                    type: p.getAttribute('type')
                };
                let def = p.getAttribute('default');
                if (def)
                    prp.default = def;
                let values = p.getAttribute('values');
                if (values)
                    prp.values = values.split('|');
                let internal = p.getAttribute('internal');
                if (internal)
                    prp.internal = internal;
                obj.properties[p.getAttribute('name')] = prp;
            }
        }
        else if (childNode.nodeName == 'settings') {
            obj.settings = {};
            for (let p of childNode.children) {
                obj.settings[p.nodeName] = p.textContent;
            }
        }
        else {
            let tx = childNode.textContent;
            if (tx[0] === '\n' && tx.endsWith('\n'))
                tx = tx.substring(1, tx.length - 1);
            else if (tx[0] === '\n')
                tx = tx.substring(1);
            else if (tx.endsWith('\n'))
                tx = tx.substring(0, tx.length - 1);
            obj[childNode.nodeName] = tx;
        }
    }
    return obj;
}
export function convertToXml(type, screen) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += type == 'screen' ? "<screen>\n" : "<control>\n";
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
    if (screen.script) {
        xml += "    <script><![CDATA[\n";
        xml += escapeCData(screen.script);
        xml += "\n]]></script>\n";
    }
    if (screen.properties && Object.getOwnPropertyNames(screen.properties).length) {
        xml += "    <properties>\n";
        for (let p in screen.properties) {
            xml += `        <property name="${p}"`;
            if (screen.properties[p].type)
                xml += ` type="${screen.properties[p].type}"`;
            if (screen.properties[p].default)
                xml += ` default="${escapeXml(screen.properties[p].default)}"`;
            if (screen.properties[p].values)
                xml += ` values="${screen.properties[p].values.join('|')}"`;
            if (screen.properties[p].internal)
                xml += ` internal="${screen.properties[p].internal}"`;
            xml += " />\n";
        }
        xml += "    </properties>\n";
    }
    if (screen.settings) {
        xml += "    <settings>\n";
        for (let p in screen.settings) {
            xml += "        <" + p + ">" + screen.settings[p] + "</" + p + ">\n";
        }
        xml += "    </settings>\n";
    }
    xml += type == 'screen' ? "</screen>\n" : "</control>\n";
    return xml;
}
