- properties of custom controls are modofied directly even if you close screen without save
- open screens/controls only once
- default value for bindings with converters (as fallback)
- valuetype in bindings, store it and convert value to (or we compare strings)
- defaultvalue for properties defined in custom controls
- properties as one or two way (one way send no events) (mostly we need oneway), also bindings to them will be created oneway
- maybe refresh of only one binding in base custom webcomponent?
- biding to signals in scripts (binding does work, but we need ui support)

- lazy load custom elements, so ui will be displayed before controls arrive