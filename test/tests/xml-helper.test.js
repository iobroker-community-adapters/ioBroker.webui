import { expect } from 'chai';
import { convertToXml, escapeXml } from '../../www/dist/frontend/helper/XmlHelper.js';

describe('XML helper', () => {
    it('escapes string, number, and boolean values', () => {
        expect(escapeXml('<>&\'"')).to.equal('&lt;&gt;&amp;&apos;&quot;');
        expect(escapeXml(20)).to.equal('20');
        expect(escapeXml(false)).to.equal('false');
    });

    it('exports typed property defaults, including false and zero', () => {
        const xml = convertToXml('control', {
            html: '',
            style: '',
            script: '',
            properties: {
                count: { type: 'number', default: 20 },
                disabled: { type: 'boolean', default: false },
                offset: { type: 'number', default: 0 },
                title: { type: 'string', default: 'one & "two"' }
            },
            settings: {}
        });

        expect(xml).to.include('<property name="count" type="number" default="20" />');
        expect(xml).to.include('<property name="disabled" type="boolean" default="false" />');
        expect(xml).to.include('<property name="offset" type="number" default="0" />');
        expect(xml).to.include('<property name="title" type="string" default="one &amp; &quot;two&quot;" />');
    });
});
